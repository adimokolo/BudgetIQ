import { useNavigate } from 'react-router-dom';

export default function TransactionChart() {
    const navigate = useNavigate();

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Transaction Charts</h1>
                    <p>See where your money is coming from and where it goes.</p>
                </div>

                <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => navigate('/transactions')}
                >
                    ← Transactions
                </button>
            </div>
        </div>
    );
}