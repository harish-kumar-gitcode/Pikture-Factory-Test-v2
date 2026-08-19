import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import LegalDocument from '@/components/legal/LegalDocument';

export const metadata = { title: 'Privacy Policy — Pikture Factory' };

const SECTIONS = [
  {
    heading: '1. Information We Collect',
    body: `Depending on how you use the Platform, we may collect different categories of information.`,
    subsections: [
      {
        heading: 'A. Information from Website Visitors and Enquiries',
        body: `When you submit an enquiry through a popup, contact form, or other enquiry mechanism, we may collect:`,
        list: [
          'Name',
          'Mobile/telephone number',
          'Email address',
          'Project or service requirements',
          'Location or project location, where provided',
          'Preferred date or timeframe, where provided',
          'Any other information voluntarily submitted through the enquiry form',
        ],
        after: `This information is used to understand your requirements and enable Pikture Factory's team to contact you regarding your enquiry.`,
      },
      {
        heading: 'B. Vendor Registration Information',
        body: `If you register as a vendor, we may collect:`,
        list: [
          'Name or business name',
          "Contact person's name",
          'Mobile number',
          'Email address',
          'Business address or service location',
          'Business/service information',
          'Login credentials',
          'Portfolio information',
          'Images, videos, descriptions, project details and other work uploaded by you',
          'Other information required to evaluate or manage your vendor account',
        ],
      },
      {
        heading: 'C. Client Information',
        body: `If you use the Platform as a client, we may collect information such as:`,
        list: [
          'Name',
          'Contact information',
          'Email address',
          'Project details',
          'Order or project information',
          'Communication relating to the project',
          'Information required to manage your client account and project status',
        ],
      },
      {
        heading: 'D. Project and Platform Information',
        body: `We may also collect information relating to your interaction with the Platform, including:`,
        list: [
          'Account activity',
          'Uploaded content',
          'Project status',
          'Vendor assignment information',
          'Enquiry records',
          'Messages or communications submitted through the Platform',
          'Technical information such as browser type, device information, IP address and general usage information, where collected by our hosting, analytics, security, or other technical service providers',
        ],
      },
    ],
  },
  {
    heading: '2. How We Use Your Information',
    body: `We may use collected information to:`,
    list: [
      'Create and manage vendor and client accounts.',
      'Process and respond to enquiries.',
      'Connect prospective customers with relevant vendors.',
      'Review vendor registrations and uploaded work.',
      'Review and approve vendor portfolio content for public display.',
      'Display approved vendor work on the Platform.',
      'Assign vendors to projects or orders.',
      'Allow clients to view their assigned vendor and project/order status.',
      'Communicate with users regarding enquiries, accounts, projects, and Platform-related matters.',
      'Provide customer and technical support.',
      'Maintain and improve the Platform.',
      'Prevent fraud, abuse, unauthorized access, or other misuse.',
      'Maintain records necessary for business, legal, security, or compliance purposes.',
      'Comply with applicable laws and lawful requests from authorities.',
    ],
    after: `We will seek to process personal data for specified and legitimate purposes and provide appropriate notice regarding the information being collected and the purposes for which it is used.`,
  },
  {
    heading: '3. Vendor-Uploaded Content',
    body: `Vendors may upload photographs, videos, project descriptions, portfolio material, business information, and other content through their dashboard.

Uploaded work may initially remain private or pending review.

Pikture Factory's administrators may review submitted content and determine whether it is suitable for public display.

Only content approved by the administrator may be displayed on public-facing areas of the Platform, including the homepage or portfolio sections.

By uploading content, the vendor confirms that they have the necessary rights, permissions, licences, and authorisations to upload and submit that content for review and potential publication.

Vendors should not upload confidential information, personal information belonging to another person without appropriate permission, copyrighted material they do not have permission to use, or unlawful content.`,
  },
  {
    heading: '4. Public Display of Vendor Work',
    body: `Where a vendor's work is approved for publication, the submitted portfolio material may be displayed publicly on the Platform.

This may include:`,
    list: [
      'Vendor/business name',
      'Portfolio photographs',
      'Videos',
      'Project descriptions',
      'Service information',
      'Other information intentionally submitted for public display',
    ],
    after: `Vendors should therefore ensure that any material submitted for public display is appropriate for publication and does not contain confidential or sensitive information.`,
  },
  {
    heading: '5. Enquiries Submitted by Website Visitors',
    body: `The Platform may display enquiry forms or popups when visitors view portfolio or other website content.

When you submit an enquiry, the information you provide may be transmitted to Pikture Factory's administrators or authorised personnel for follow-up.

The information may be used to:`,
    list: [
      'Understand your requirements.',
      'Contact you regarding your enquiry.',
      'Determine suitable services or vendors.',
      'Facilitate communication between you and an appropriate vendor.',
      'Manage the enquiry through the Platform.',
    ],
    after: `Submitting an enquiry does not automatically guarantee that a vendor will accept the project, that a project will be assigned, or that any particular service will be provided.`,
  },
  {
    heading: '6. Vendor Assignment and Client Project Information',
    body: `Pikture Factory may use the Platform to assign a vendor to a client's project.

Where applicable, clients may be able to view information through their client panel, including:`,
    list: [
      'The vendor assigned to their project.',
      'Project/order status.',
      'Relevant project information.',
      'Other information necessary to manage the project.',
    ],
    after: `The information available through a client account is intended for the relevant client and authorised users and should not be shared with unauthorised persons.`,
  },
  {
    heading: '7. Sharing of Information',
    body: `We may share information where reasonably necessary to operate the Platform and provide the services described above.

This may include sharing information with:`,
    list: [
      'Pikture Factory administrators and authorised personnel.',
      "Vendors where necessary to fulfil or respond to a client's enquiry or project.",
      'Clients where necessary for project management.',
      'Hosting, cloud storage, database, email, analytics, security, communication, and other technology service providers.',
      'Professional advisers or service providers where reasonably necessary.',
      'Government authorities, regulators, law-enforcement agencies, or other parties where required or permitted by applicable law.',
    ],
    after: `We do not intend to sell personal information merely for monetary consideration.`,
  },
  {
    heading: '8. Third-Party Services',
    body: `The Platform may use third-party services for functions such as:`,
    list: [
      'Website hosting',
      'Database management',
      'Cloud storage',
      'Authentication',
      'Email or communication',
      'Analytics',
      'Security',
      'File or media storage',
    ],
    after: `Such third parties may process information on behalf of Pikture Factory to provide the relevant service.

Third-party services may have their own privacy policies and terms. We recommend reviewing those policies where applicable.`,
  },
  {
    heading: '9. Cookies and Similar Technologies',
    body: `The Platform may use cookies, local storage, analytics technologies, or similar mechanisms to:`,
    list: [
      'Keep users logged in.',
      'Maintain sessions.',
      'Remember preferences.',
      'Improve Platform functionality.',
      'Understand website usage.',
      'Maintain security.',
      'Diagnose technical problems.',
    ],
    after: `You may be able to control cookies through your browser settings. Disabling certain cookies may affect some Platform functionality.`,
  },
  {
    heading: '10. Data Security',
    body: `We take reasonable technical and organisational measures to protect personal information against unauthorised access, misuse, alteration, disclosure, loss, or destruction.

However, no internet-based service can guarantee absolute security.

Users are responsible for maintaining the confidentiality of their account credentials and should immediately notify Pikture Factory if they suspect unauthorised access to their account.`,
  },
  {
    heading: '11. Data Retention',
    body: `We retain personal information for as long as reasonably necessary to fulfil the purposes for which it was collected, operate accounts and projects, maintain business records, resolve disputes, enforce agreements, protect the Platform, or comply with applicable legal obligations.

When information is no longer reasonably required, it may be deleted, anonymised, or otherwise securely disposed of, subject to applicable law and legitimate business requirements.`,
  },
  {
    heading: '12. Your Choices and Rights',
    body: `Subject to applicable law, you may have rights relating to your personal information, including the ability to:`,
    list: [
      'Request information about personal data we hold about you.',
      'Request correction of inaccurate information.',
      'Request deletion of information where applicable.',
      'Withdraw consent where processing is based on consent.',
      'Request information about how your personal information is being processed.',
      'Raise a grievance regarding the handling of your personal information.',
    ],
    after: `Where consent is the basis for processing, withdrawal of consent may affect our ability to provide certain Platform features or services.

Requests may be submitted using the contact details provided below.`,
  },
  {
    heading: "13. Children's Privacy",
    body: `The Platform is not intentionally designed to collect personal information from children.

If you believe that a child has provided personal information to us without appropriate consent, please contact us so that we can review and take appropriate action.`,
  },
  {
    heading: '14. Account Security',
    body: `Vendor and client accounts may contain project, contact, portfolio, or other information.

Users must:`,
    list: [
      'Keep login credentials confidential.',
      'Not share their account with unauthorised persons.',
      'Use accurate information.',
      'Notify Pikture Factory of suspected unauthorised access.',
      "Not attempt to access another user's account or information.",
    ],
  },
  {
    heading: '15. Changes to This Privacy Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes to the Platform, our practices, technology, or applicable legal requirements.

The updated version will be published on this page with a revised "Last Updated" date.

Your continued use of the Platform after an update constitutes acknowledgement of the updated policy, subject to applicable law.`,
  },
  {
    heading: '16. Contact and Grievances',
    body: `If you have questions, concerns, requests, or grievances relating to this Privacy Policy or the handling of your personal information, please contact:`,
    contactCard: {
      lines: [
        ['Pikture Factory', null],
        ['Email', 'support@pikturefactory.in'],
        ['Phone', '+91 72043 39503'],
        ['Address', 'Kallumantapa, Ramamurthy Nagar, Bengaluru, Karnataka 560016'],
      ],
    },
    after: `Please replace the placeholders above with the client's actual legal/business details before publishing.`,
  },
  {
    heading: '17. Governing Law',
    body: `This Privacy Policy shall be interpreted in accordance with applicable laws of India, subject to the jurisdiction and legal requirements applicable to Pikture Factory and its users.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <LegalDocument
        eyebrow="Legal"
        title="Privacy Policy"
        lastUpdated="19 August 2026"
        intro={`Pikture Factory ("Pikture Factory", "we", "our", or "us") operates the Pikture Factory website and platform (the "Platform"). The Platform enables visitors to discover work displayed by registered vendors, submit enquiries, allows vendors to create accounts and upload their work, and provides clients with access to information relating to their assigned projects and vendors.

This Privacy Policy explains how we collect, use, store, disclose, and protect personal information when you use our website, vendor portal, client panel, or related services.

By using the Platform or submitting information through it, you acknowledge that you have read and understood this Privacy Policy.`}
        sections={SECTIONS}
      />
      <Footer />
    </>
  );
}
