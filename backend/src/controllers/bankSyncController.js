const crypto = require('crypto');
const pool = require('../config/db');

const MONO_BASE_URL = 'https://api.withmono.com/v2';

function requireMonoKey() {
  if (!process.env.MONO_SEC_KEY) {
    const error = new Error('MONO_SEC_KEY is not configured on the backend.');
    error.status = 500;
    throw error;
  }
}

async function monoRequest(path, options = {}) {
  requireMonoKey();

  const response = await fetch(`${MONO_BASE_URL}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'mono-sec-key': process.env.MONO_SEC_KEY,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Mono API request failed.');
    error.status = response.status;
    error.mono = data;
    throw error;
  }

  return data;
}

function moneyFromMinorUnit(value, currency = 'NGN') {
  const amount = Number(value || 0);
  // Mono returns NGN in kobo and other supported currencies in their lowest denomination.
  return amount / 100;
}

function maskAccountNumber(accountNumber) {
  const value = String(accountNumber || '');
  if (value.length <= 4) return value;
  return `****${value.slice(-4)}`;
}

async function getUser(userId) {
  const result = await pool.query(
    'SELECT id, full_name, email, currency FROM users WHERE id = $1',
    [userId],
  );
  return result.rows[0] || null;
}

async function initiateBankLink(req, res) {
  try {
    const user = await getUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const ref = `BIQ-${req.user.id}-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
    const redirectUrl = process.env.MONO_REDIRECT_URL || 'budgetiqmobileapp://bank-sync';

    await pool.query(
      `INSERT INTO bank_accounts
       (user_id, provider, link_ref, status)
       VALUES ($1, 'mono', $2, 'pending')`,
      [req.user.id, ref],
    );

    const monoResponse = await monoRequest('/accounts/initiate', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          name: user.full_name,
          email: user.email,
        },
        meta: { ref },
        scope: 'auth',
        redirect_url: redirectUrl,
      }),
    });

    const link =
      monoResponse?.data?.mono_url ||
      monoResponse?.data?.url ||
      monoResponse?.data?.link ||
      monoResponse?.data?.connect_url ||
      monoResponse?.url ||
      monoResponse?.link;

    if (!link) {
      console.error('Unexpected Mono initiate response:', monoResponse);
      await pool.query(
        `UPDATE bank_accounts SET status = 'failed' WHERE link_ref = $1`,
        [ref],
      );
      return res.status(502).json({ error: 'Mono did not return a bank-link URL.' });
    }

    res.json({
      link,
      ref,
      status: 'pending',
    });
  } catch (error) {
    console.error('Bank link initiation error:', error.mono || error);
    res.status(error.status || 500).json({
      error: error.message || 'Unable to start bank synchronization.',
    });
  }
}

async function fetchMonoAccount(monoAccountId) {
  return monoRequest(`/accounts/${encodeURIComponent(monoAccountId)}`);
}

async function fetchMonoTransactions(monoAccountId) {
  return monoRequest(`/accounts/${encodeURIComponent(monoAccountId)}/transactions?paginate=false`);
}

async function syncBankAccount(bankAccountId) {
  const bankResult = await pool.query(
    'SELECT * FROM bank_accounts WHERE id = $1',
    [bankAccountId],
  );
  const bankAccount = bankResult.rows[0];

  if (!bankAccount) throw Object.assign(new Error('Bank account not found.'), { status: 404 });
  if (!bankAccount.mono_account_id) {
    throw Object.assign(new Error('This bank account has not finished connecting.'), { status: 409 });
  }

  const accountResponse = await fetchMonoAccount(bankAccount.mono_account_id);
  const account = accountResponse?.data?.account || accountResponse?.data || accountResponse?.account;
  const meta = accountResponse?.data?.meta || accountResponse?.meta || {};

  const dataStatus = meta.data_status || meta.dataStatus || 'PROCESSING';

  if (dataStatus !== 'AVAILABLE' && dataStatus !== 'PARTIAL') {
    await pool.query(
      `UPDATE bank_accounts
       SET status = 'processing', data_status = $1, updated_at = now()
       WHERE id = $2`,
      [dataStatus, bankAccount.id],
    );
    return { status: 'processing', dataStatus, imported: 0 };
  }

  const currency = account?.currency || bankAccount.currency || 'NGN';
  const rawBalance = account?.balance;
  const balance = rawBalance == null ? null : moneyFromMinorUnit(rawBalance, currency);
  const accountNumber = account?.account_number || account?.accountNumber;
  const institution = account?.institution || {};

  await pool.query(
    `UPDATE bank_accounts
     SET account_name = $1,
         account_number_masked = $2,
         bank_name = $3,
         bank_code = $4,
         account_type = $5,
         currency = $6,
         balance = $7,
         status = 'connected',
         data_status = $8,
         last_synced_at = now(),
         updated_at = now()
     WHERE id = $9`,
    [
      account?.name || null,
      maskAccountNumber(accountNumber),
      institution?.name || null,
      institution?.bank_code || institution?.bankCode || null,
      account?.type || null,
      currency,
      balance,
      dataStatus,
      bankAccount.id,
    ],
  );

  let imported = 0;
  if (meta.retrieved_data?.includes('transactions') || dataStatus === 'AVAILABLE') {
    const txResponse = await fetchMonoTransactions(bankAccount.mono_account_id);
    const transactions = Array.isArray(txResponse?.data)
      ? txResponse.data
      : Array.isArray(txResponse?.data?.transactions)
        ? txResponse.data.transactions
        : Array.isArray(txResponse?.transactions)
          ? txResponse.transactions
          : [];

    for (const tx of transactions) {
      const externalId = String(tx?._id || tx?.id || '').trim();
      if (!externalId) continue;

      const type = tx?.type === 'credit' ? 'income' : 'expense';
      const amount = moneyFromMinorUnit(tx?.amount, currency);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const occurredOn = tx?.date ? new Date(tx.date).toISOString().slice(0, 10) : null;
      const description = tx?.narration || tx?.description || 'Bank transaction';

      const result = await pool.query(
        `INSERT INTO transactions
          (user_id, account_id, type, amount, description, occurred_on, source, external_id)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), 'bank', $7)
         ON CONFLICT (user_id, source, external_id) DO NOTHING
         RETURNING id`,
        [bankAccount.user_id, bankAccount.id, type, amount, description, occurredOn, externalId],
      );

      if (result.rowCount > 0) imported += 1;
    }
  }

  return { status: 'connected', dataStatus, imported };
}

async function handleMonoWebhook(req, res) {
  const configuredSecret = process.env.MONO_WEBHOOK_SEC;
  const incomingSecret = req.headers['mono-webhook-secret'];

  if (!configuredSecret || incomingSecret !== configuredSecret) {
    return res.status(401).json({ error: 'Unauthorized webhook request.' });
  }

  const webhook = req.body || {};
  const event = webhook.event;
  const eventId = webhook.event_id;
  const data = webhook.data || {};

  // Acknowledge immediately. Mono retries webhook calls that do not receive 2xx.
  res.status(200).json({ received: true });

  if (!event || !eventId) return;

  setImmediate(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eventInsert = await client.query(
        `INSERT INTO mono_webhook_events (event_id, event_name)
         VALUES ($1, $2)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [eventId, event],
      );

      await client.query('COMMIT');
      client.release();

      if (eventInsert.rowCount === 0) return;

      const ref = data?.meta?.ref || data?.meta?.reference;
      const monoAccountId = data?.id || data?.account?._id || data?.account?.id;
      if (!ref && !monoAccountId) return;

      const accountResult = await pool.query(
        `SELECT * FROM bank_accounts
         WHERE ($1::text IS NOT NULL AND link_ref = $1)
            OR ($2::text IS NOT NULL AND mono_account_id = $2)
         ORDER BY created_at DESC
         LIMIT 1`,
        [ref || null, monoAccountId || null],
      );
      const bankAccount = accountResult.rows[0];
      if (!bankAccount) return;

      if (monoAccountId && !bankAccount.mono_account_id) {
        await pool.query(
          `UPDATE bank_accounts
           SET mono_account_id = $1, status = 'processing', updated_at = now()
           WHERE id = $2`,
          [monoAccountId, bankAccount.id],
        );
      }

      try {
        await syncBankAccount(bankAccount.id);
      } catch (syncError) {
        console.error('Mono bank sync error:', syncError.mono || syncError);
        await pool.query(
          `UPDATE bank_accounts SET status = 'failed', updated_at = now() WHERE id = $1`,
          [bankAccount.id],
        );
      }
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      client.release();
      console.error('Mono webhook processing error:', error);
    }
  });
}

async function getBankLinkStatus(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, status, data_status, account_name, account_number_masked,
              bank_name, account_type, currency, balance, last_synced_at, created_at
       FROM bank_accounts
       WHERE user_id = $1 AND link_ref = $2`,
      [req.user.id, req.params.ref],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bank connection not found.' });
    }

    res.json({ account: result.rows[0] });
  } catch (error) {
    console.error('Bank link status error:', error);
    res.status(500).json({ error: 'Unable to check bank connection status.' });
  }
}

async function listBankAccounts(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, status, data_status, account_name, account_number_masked,
              bank_name, account_type, currency, balance, last_synced_at, created_at
       FROM bank_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    res.json({ accounts: result.rows });
  } catch (error) {
    console.error('Bank accounts list error:', error);
    res.status(500).json({ error: 'Unable to load bank accounts.' });
  }
}

async function refreshBankAccount(req, res) {
  try {
    const result = await pool.query(
      'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    const syncResult = await syncBankAccount(req.params.id);
    res.json(syncResult);
  } catch (error) {
    console.error('Bank account refresh error:', error.mono || error);
    res.status(error.status || 500).json({
      error: error.message || 'Unable to refresh bank account.',
    });
  }
}

module.exports = {
  initiateBankLink,
  handleMonoWebhook,
  getBankLinkStatus,
  listBankAccounts,
  refreshBankAccount,
};
