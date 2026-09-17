import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";

const LEGAL_DETAILS = {
  operatorName: "BudgetIQ",
  businessAddress: "Lagos, Nigeria",
  supportEmail: "support@budgetiq.app",
  privacyEmail: "privacy@budgetiq.app",
  website: "https://budgetiq.app",
};

const TERMS_SECTIONS = [
  {
    title: "Introduction",
    paragraphs: [
      `These Terms of Service form a binding agreement between you and ${LEGAL_DETAILS.operatorName}, trading as BudgetIQ (“BudgetIQ”, “we”, “us” or “our”).`,

      "By creating an account, selecting acceptance or using the BudgetIQ mobile application, web application, websites, APIs or related services, you agree to these Terms and our Privacy Policy.",

      "If you do not agree to these Terms, you must not create an account or use BudgetIQ.",
    ],
  },

  {
    title: "1. Eligibility and authority",
    paragraphs: [
      "You must be at least 18 years old and legally capable of entering into a contract to use BudgetIQ.",

      "If you use BudgetIQ for an organisation, you confirm that you have authority to bind that organisation.",

      "BudgetIQ is designed primarily for users in Nigeria, although services are also accessible around the world.",
    ],
  },

  {
    title: "2. BudgetIQ services",
    paragraphs: [
      "BudgetIQ provides tools for personal financial organisation. Depending on the version available to you, the services may include:",
    ],
    bullets: [
      "Account registration, email verification, login, password recovery, profile management and account deletion.",
      "Manual financial accounts, balances, notes, categories, income and expense transactions.",
      "Monthly budgets, spending progress, dashboard summaries, notifications, forecasts, reports and exports.",
      "Display and conversion of amounts in more than 70 currencies using reference exchange rates.",
      "Optional connection to eligible bank accounts through an approved financial-data provider.",
      "Features may differ between the mobile and web applications. Both applications uses same BudgetIQ account, backend and database across platforms.",
    ],
  },

  {
    title: "3. BudgetIQ is not a financial institution",
    paragraphs: [
      "BudgetIQ is a financial-information and budgeting tool. Unless expressly stated in a separate written agreement, BudgetIQ is not a bank, deposit-taking institution, payment service provider, lender, insurer, broker, accountant, tax adviser or investment adviser.",

      "BudgetIQ does not hold or move your money and does not guarantee savings, investment returns, credit approval or financial outcomes.",

      "Budgets, forecasts, categories, currency conversions, alerts and summaries are informational estimates. You remain responsible for reviewing original bank records and obtaining qualified advice before making financial, tax, legal, credit or investment decisions.",
    ],
  },

  {
    title: "4. Your account and security",
    paragraphs: [
      "You must provide accurate information and keep it current. You are responsible for protecting your password, verification codes, devices and active sessions.",

      "Do not share one-time passwords or allow another person to use your account.",

      `Notify us promptly at ${LEGAL_DETAILS.supportEmail} if you suspect unauthorised access.`,

      "We may require email verification, reauthentication or other checks before allowing sensitive account actions.",
    ],
  },

  {
    title: "5. Your financial information",
    paragraphs: [
      "You retain ownership of transaction descriptions, amounts, categories, account information, notes, profile images and other content you submit.",

      "You grant BudgetIQ a limited, worldwide, non-exclusive licence to host, reproduce, organise, calculate, display, transmit, back up and process that content only as needed to operate, secure, support and improve the service and comply with applicable law.",

      "You confirm that you have the right to provide the information and that it does not violate another person’s rights.",

      "You are responsible for checking manually entered information and imported records for accuracy.",
    ],
  },

  {
    title: "6. Bank synchronization",
    paragraphs: [
      "If bank synchronization is available and you choose to use it, you authorise BudgetIQ and the identified financial-data provider to request and receive permitted account information from your selected financial institution.",

      "The connection may provide account identity, balances and transaction history.",

      "BudgetIQ will not ask you to send your bank password, card PIN or one-time bank authentication code through an ordinary BudgetIQ form, email or support message.",

      "Your bank and the financial-data provider may apply separate terms and privacy notices.",

      "Bank connections may fail, be delayed, omit information, duplicate records or become unavailable. You must compare BudgetIQ information with your bank’s official records.",

      "You may disconnect a linked account through available settings or by contacting us. Information already imported may remain until it is deleted under our retention rules.",
    ],
  },

  {
    title: "7. Currency information",
    paragraphs: [
      "Exchange rates may come from an external reference-rate service and may be delayed, rounded, unavailable or different from rates offered by a bank or card provider.",

      "Converted amounts are estimates for budgeting and display. They are not quotations for a currency transaction.",
    ],
  },

  {
    title: "8. Notifications and communications",
    paragraphs: [
      "BudgetIQ may send service messages by email or through the application, including verification codes, password-reset messages, security notices, budget alerts, account notices and material updates.",

      "These operational messages are part of the service.",

      "Budget alerts depend on the information available when the budget check runs. A delayed or missing alert does not change your responsibility for monitoring spending and account activity.",

      "Marketing messages, if introduced, will use an appropriate lawful basis and provide an available opt-out where required.",
    ],
  },

  {
    title: "9. Acceptable use",
    paragraphs: ["You must not:"],
    bullets: [
      "Use BudgetIQ unlawfully, fraudulently or to violate another person’s privacy or intellectual-property rights.",
      "Submit malware, attack the service, test vulnerabilities without written permission, bypass access controls or interfere with another user.",
      "Scrape, copy, resell, reverse engineer or create derivative services from BudgetIQ except where applicable law permits.",
      "Use another person’s account or financial information without authority.",
      "Misrepresent BudgetIQ output as an official bank statement, audited record or professional financial advice.",
      "Use automated methods that place an unreasonable load on the service.",
    ],
  },

  {
    title: "10. Intellectual property",
    paragraphs: [
      "BudgetIQ and its licensors own the service, software, interface, branding, documentation and other materials, excluding content provided by users.",

      "Subject to these Terms, we grant you a personal, limited, revocable, non-exclusive and non-transferable licence to use BudgetIQ for lawful personal financial management.",

      "Feedback you voluntarily provide may be used without restriction or payment, provided we do not identify you publicly without permission.",
    ],
  },

  {
    title: "11. Third-party services",
    paragraphs: [
      "BudgetIQ may rely on hosting, database, email, currency-rate, file-storage, application-distribution and bank-connection providers.",

      "Third-party services may be unavailable or governed by separate terms.",

      "We are not responsible for a third party’s independent acts, services, statements or security. We remain responsible for our own obligations under applicable law when a provider processes personal data for us.",
    ],
  },

  {
    title: "12. Availability and changes",
    paragraphs: [
      "We may maintain, update, suspend, replace or discontinue features.",

      "We do not promise uninterrupted or error-free operation.",

      "Where reasonably possible, we will provide notice before a material discontinuation that affects stored user data.",

      "You should retain copies of information you need, including exported financial records.",
    ],
  },

  {
    title: "13. Suspension and termination",
    paragraphs: [
      `You may stop using BudgetIQ and request account deletion through the available settings or by contacting ${LEGAL_DETAILS.supportEmail}.`,

      "We may restrict or suspend access when reasonably necessary to protect users or systems, investigate suspected misuse, comply with law, address non-payment if paid plans are introduced or enforce these Terms.",

      "Account deletion is intended to remove the account and associated active data, subject to legal retention, fraud prevention, dispute resolution, security records and backup cycles described in the Privacy Policy.",
    ],
  },

  {
    title: "14. Disclaimers",
    paragraphs: [
      "To the extent permitted by law, the service is provided as available and without warranties that are not expressly stated in these Terms.",

      "We do not warrant that data, forecasts, alerts, bank imports, currency conversions or exports will always be accurate, complete, current or available.",

      "Nothing in these Terms excludes a warranty or consumer right that cannot lawfully be excluded.",
    ],
  },

  {
    title: "15. Limitation of liability",
    paragraphs: [
      "To the extent permitted by law, BudgetIQ and its operator will not be liable for indirect, incidental, special, punitive or consequential loss, or for loss of profits, opportunities, goodwill or data arising from use of the service.",

      "We are not responsible for losses caused solely by inaccurate user entries, decisions made without checking source records, the acts of a financial institution or a third-party outage beyond our reasonable control.",

      "Our total liability arising from the service during the 12 months before the event giving rise to a claim will not exceed the greater of the amount you paid BudgetIQ during that period or NGN 50,000.",

      "This limit does not apply where prohibited by law, including liability that cannot be limited for fraud, wilful misconduct, death, personal injury or violation of mandatory data-protection or consumer rights.",
    ],
  },

  {
    title: "16. Indemnity",
    paragraphs: [
      "To the extent permitted by law, you will reimburse BudgetIQ for reasonable losses and costs arising from your unlawful use of the service, your material breach of these Terms or your infringement of another person’s rights.",

      "This clause does not require you to indemnify BudgetIQ for its own negligence, unlawful conduct or breach.",
    ],
  },

  {
    title: "17. Changes to these Terms",
    paragraphs: [
      "We may update these Terms to reflect legal, security, operational or product changes.",

      "We will publish the revised Terms and change the effective date.",

      "We will provide reasonable advance notice of material changes through BudgetIQ or by email where practicable.",

      "If a change requires consent under applicable law, we will request it.",
    ],
  },

  {
    title: "18. Governing law and disputes",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria, without limiting any mandatory rights you have under another applicable law.",

      `Before filing a claim, you and BudgetIQ should first try to resolve the dispute in good faith by sending written notice to ${LEGAL_DETAILS.supportEmail}.`,

      "If the dispute is not resolved, either party may bring it before a court of competent jurisdiction in Nigeria.",

      "Nothing prevents either party from seeking urgent protective relief or contacting a regulator.",
    ],
  },

  {
    title: "19. General terms",
    paragraphs: [
      "If any provision is unenforceable, it will be limited or removed to the minimum extent necessary and the remaining provisions will continue.",

      "A delay in enforcing a right is not a waiver.",

      "You may not transfer your agreement without our consent. We may transfer it as part of a merger, reorganisation, financing or sale, subject to applicable law and the Privacy Policy.",

      "These Terms, the Privacy Policy and any feature-specific terms form the entire agreement concerning BudgetIQ.",
    ],
  },

  {
    title: "20. Contact",
    paragraphs: [
      `Questions about these Terms may be sent to ${LEGAL_DETAILS.operatorName}.`,

      `Business address: ${LEGAL_DETAILS.businessAddress}`,

      `Support email: ${LEGAL_DETAILS.supportEmail}`,
    ],
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "Introduction",
    paragraphs: [
      `This Privacy Policy explains how ${LEGAL_DETAILS.operatorName}, trading as BudgetIQ, collects, uses, stores, shares and protects personal data when you use BudgetIQ.`,

      "This Policy is intended to support compliance with the Nigeria Data Protection Act 2023 and other applicable privacy laws.",
    ],
  },

  {
    title: "1. Who controls your personal data",
    paragraphs: [
      `${LEGAL_DETAILS.operatorName} is the data controller for personal data processed through BudgetIQ, except where a third party acts as an independent controller under its own privacy notice.`,

      `You may contact the privacy team at ${LEGAL_DETAILS.privacyEmail}.`,

      `Business address: ${LEGAL_DETAILS.businessAddress}`,
    ],
  },

  {
    title: "2. Personal data we collect",
    paragraphs: [
      "Depending on the features you use, BudgetIQ may collect the following information:",
    ],
    bullets: [
      "Identity and account information, including your full name, username, email address, preferred currency, verification status, profile image and account dates.",
      "Authentication and security information, including password hashes, verification and password-reset records, session or JWT information and security events.",
      "Financial records, including manual accounts, account names, currencies, balances, notes, income, expenses, dates, descriptions and categories.",
      "Budget and insight information, including monthly limits, spending progress, notifications, dashboard summaries, forecasts, reports and exports.",
      "Bank-connection information, including provider connection identifiers, institution details, account details, balances, transaction history and synchronization status.",
      "Technical information, including IP address, device and application information, request logs, timestamps, error logs and security logs.",
      "Communications, including support requests, verification emails, password-reset emails and notification-delivery records.",
      "BudgetIQ does not need your bank password, card PIN or full card security code. Do not send this information to us.",
    ],
  },

  {
    title: "3. How we use personal data",
    bullets: [
      "Create, verify, secure and manage your BudgetIQ account.",
      "Store and display transactions, accounts, balances, categories, budgets and profile information.",
      "Calculate totals, spending progress, net position, forecasts, currency displays, reports and exports.",
      "Connect and synchronize eligible bank information when you request it.",
      "Send verification, password-reset, security, budget and service notifications.",
      "Provide support, diagnose errors, protect the service, prevent misuse and keep audit records.",
      "Improve features using aggregated or de-identified information where reasonably possible.",
      "Comply with legal obligations and respond to lawful requests.",
    ],
  },

  {
    title: "4. Legal bases for processing",
    bullets: [
      "Performance of our contract with you for account registration, authentication, financial tools, exports and requested support.",
      "Consent for optional bank connections and optional marketing where consent is required.",
      "Our legitimate interests for security, fraud prevention, service diagnostics and product administration, balanced against your rights.",
      "Compliance with a legal obligation for tax, accounting, regulatory, court and lawful-authority requirements.",
      "Vital interests where processing is urgently required to protect a person.",
    ],
    paragraphs: [
      "Where we rely on consent, refusing or withdrawing consent will not affect processing already completed lawfully.",

      "Withdrawing consent may prevent an optional feature from operating.",

      "Where information is required to provide the core service, refusing to provide it may prevent account creation or use.",
    ],
  },

  {
    title: "5. Automated calculations and forecasts",
    paragraphs: [
      "BudgetIQ may automatically categorise, total, compare, convert or forecast information based on your records.",

      "These functions provide budgeting assistance and do not make decisions that produce legal or similarly significant effects about you.",

      "You should review generated results and correct the underlying records when necessary.",
    ],
  },

  {
    title: "6. How we share personal data",
    paragraphs: [
      "BudgetIQ does not sell personal data.",

      "We may share the minimum information necessary with the following recipients:",
    ],
    bullets: [
      "Infrastructure and database providers that host BudgetIQ.",
      "Email providers that deliver verification, password-reset, security and notification messages.",
      "File-storage providers used for profile images or exported records.",
      "Reference currency-rate providers when a currency conversion is requested.",
      "A bank-connection provider and the relevant financial institution when you activate bank synchronization.",
      "Professional advisers, auditors, insurers and potential transaction parties under appropriate confidentiality obligations.",
      "Courts, regulators, law-enforcement bodies or other recipients when disclosure is legally required or necessary to protect rights and safety.",
    ],
  },

  {
    title: "7. International data transfers",
    paragraphs: [
      "Some service providers may process personal data outside Nigeria.",

      "When personal data is transferred internationally, we will use a lawful transfer mechanism and appropriate safeguards, such as an adequacy basis, contractual protection, valid consent or another mechanism permitted by the Nigeria Data Protection Act.",

      `You may request information about applicable safeguards by contacting ${LEGAL_DETAILS.privacyEmail}.`,
    ],
  },

  {
    title: "8. Data retention",
    paragraphs: [
      "We retain personal data only for as long as necessary for the purposes described in this Policy, including service delivery, security, dispute resolution and legal compliance.",
    ],
    bullets: [
      "Active account and financial records are retained while your account is active and until deletion is completed, unless a legal reason requires longer retention.",
      "Email-verification and password-reset secrets are stored in hashed form and expire after a short period.",
      "Security and server logs are retained for a limited period appropriate for investigation, reliability and abuse prevention.",
      "Support and dispute records are retained while needed to resolve the request and establish or defend legal claims.",
      "Backups are removed or overwritten through scheduled backup cycles, with access restricted while they are retained.",
      "De-identified statistics may be retained where they no longer identify a person.",
    ],
  },

  {
    title: "9. Security",
    paragraphs: [
      "BudgetIQ uses technical and organisational measures intended to protect personal data.",

      "Security controls include password hashing, hashed verification and password-reset secrets, authenticated API routes, user-scoped database queries, environment-based secret management, transport security in production and access controls.",

      "No online service can guarantee absolute security. You should use a unique password, protect your device, sign out of shared devices and report suspected compromise.",

      "If a personal-data breach creates a legally reportable risk, we will notify the Nigeria Data Protection Commission and affected individuals as required.",
    ],
  },

  {
    title: "10. Your privacy rights",
    paragraphs: [
      "Subject to applicable law and permitted exceptions, you may:",
    ],
    bullets: [
      "Ask whether we process your personal data and request access to it.",
      "Request correction of inaccurate or incomplete information.",
      "Request deletion of personal data.",
      "Request restriction of processing.",
      "Object to processing based on legitimate interests or direct marketing.",
      "Request portable data in an appropriate, commonly used format where the right applies.",
      "Withdraw consent without affecting processing already lawfully completed.",
      "Request information about significant automated decision-making if such processing is introduced.",
      "Complain to the Nigeria Data Protection Commission or another competent authority.",
    ],
    paragraphsAfter: [
      `Send privacy requests to ${LEGAL_DETAILS.privacyEmail}.`,

      "We may verify your identity and request information needed to locate the relevant records.",

      "We will respond within the period required by applicable law. If we cannot fulfil a request, we will explain the reason unless the law prevents us from doing so.",
    ],
  },

  {
    title: "11. Account deletion",
    paragraphs: [
      `You may request account deletion through the available profile settings or by contacting ${LEGAL_DETAILS.supportEmail}.`,

      "We may require your password or another identity check before deleting your account.",

      "Deletion removes or anonymises active account data, subject to applicable retention exceptions.",

      "Disconnecting a bank account stops future synchronization but does not automatically delete information previously imported into BudgetIQ.",
    ],
  },

  {
    title: "12. Children",
    paragraphs: [
      "BudgetIQ is intended for adults aged 18 and over.",

      "We do not knowingly offer accounts to children or intentionally collect children’s personal data.",

      `If you believe a child has provided personal data, contact ${LEGAL_DETAILS.privacyEmail} so we can investigate and take appropriate action.`,
    ],
  },

  {
    title: "13. Communications and preferences",
    paragraphs: [
      "You cannot opt out of communications required for account security and operation, such as verification and password-reset emails.",

      "You may control optional notifications through available BudgetIQ settings.",

      "If marketing communications are introduced, each message will provide an appropriate method to unsubscribe.",
    ],
  },

  {
    title: "14. Cookies and local storage",
    paragraphs: [
      "The BudgetIQ web application may use strictly necessary cookies or browser storage for authentication, security, preferences and session continuity.",

      "The mobile application may store authentication tokens and preferences on your device.",

      "If BudgetIQ introduces non-essential analytics or advertising technologies, we will update this Policy and provide any consent controls required by law.",
    ],
  },

  {
    title: "15. Third-party links and services",
    paragraphs: [
      "BudgetIQ may link to a bank, application store or other third party.",

      "Their privacy practices are governed by their own privacy notices. Review those notices before providing personal information.",

      "BudgetIQ is not responsible for processing performed independently by another data controller.",
    ],
  },

  {
    title: "16. Changes to this Privacy Policy",
    paragraphs: [
      "We may update this Policy when our products, providers or legal obligations change.",

      "We will publish the revised version and update its effective date.",

      "We will provide additional notice for material changes and obtain consent when required.",
    ],
  },

  {
    title: "17. Questions and complaints",
    paragraphs: [
      `Contact ${LEGAL_DETAILS.operatorName} at ${LEGAL_DETAILS.privacyEmail} with privacy questions or requests.`,

      `Business address: ${LEGAL_DETAILS.businessAddress}`,

      "You may also contact the Nigeria Data Protection Commission through its official website at https://ndpc.gov.ng.",
    ],
  },
];

export default function TermsAndPrivacyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { colors } = useTheme();

  const startingTab = params.section === "privacy" ? "privacy" : "terms";

  const [activeTab, setActiveTab] = useState(startingTab);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const sections = activeTab === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  const screenTitle =
    activeTab === "terms" ? "Terms of Service" : "Privacy Policy";

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: colors.chipBg,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={21} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Legal
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "terms" && {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab("terms")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "terms" ? "#FFFFFF" : colors.textMuted,
              },
            ]}
          >
            Terms
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "privacy" && {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab("privacy")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "privacy" ? "#FFFFFF" : colors.textMuted,
              },
            ]}
          >
            Privacy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          BudgetIQ {screenTitle}
        </Text>

        <Text
          style={[
            styles.effectiveDate,
            {
              color: colors.textMuted,
            },
          ]}
        ></Text>

        {sections.map((section, sectionIndex) => (
          <View key={`${activeTab}-${sectionIndex}`} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.primary,
                },
              ]}
            >
              {section.title}
            </Text>

            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <Text
                key={`paragraph-${paragraphIndex}`}
                style={[
                  styles.paragraph,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {paragraph}
              </Text>
            ))}

            {section.bullets?.map((bullet, bulletIndex) => (
              <View key={`bullet-${bulletIndex}`} style={styles.bulletRow}>
                <View
                  style={[
                    styles.bullet,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.bulletText,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {bullet}
                </Text>
              </View>
            ))}

            {section.paragraphsAfter?.map((paragraph, paragraphIndex) => (
              <Text
                key={`paragraph-after-${paragraphIndex}`}
                style={[
                  styles.paragraph,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <Text
          style={[
            styles.footerText,
            {
              color: colors.textFaint,
              borderTopColor: colors.cardBorder,
            },
          ]}
        >
          If you have questions about these policies, contact{" "}
          {LEGAL_DETAILS.supportEmail}.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      height: 58,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
    },

    backButton: {
      width: 28,
      height: 28,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
    },

    headerSpacer: {
      width: 28,
    },

    tabContainer: {
      flexDirection: "row",
      marginHorizontal: 18,
      marginTop: 15,
      padding: 4,
      borderRadius: 13,
      borderWidth: 1,
    },

    tabButton: {
      flex: 1,
      minHeight: 35,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    tabText: {
      fontSize: 12,
      fontWeight: "700",
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 50,
    },

    title: {
      fontSize: 23,
      lineHeight: 32,
      fontWeight: "700",
      marginBottom: 3,
    },

    section: {
      marginBottom: 23,
    },

    sectionTitle: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "700",
      marginBottom: 9,
    },

    paragraph: {
      fontSize: 12,
      lineHeight: 19,
      marginBottom: 9,
    },

    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 9,
      paddingRight: 4,
    },

    bullet: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginTop: 8,
      marginRight: 10,
    },

    bulletText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 22,
    },

    footerText: {
      fontSize: 11,
      lineHeight: 15,
      paddingTop: 15,
      borderTopWidth: 1,
    },
  });
}
