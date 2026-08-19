import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import LegalDocument from '@/components/legal/LegalDocument';

export const metadata = { title: 'Terms & Conditions — Pikture Factory' };

const SECTIONS = [
  {
    heading: '1. About the Platform',
    body: `Pikture Factory provides a digital platform through which:`,
    list: [
      'Visitors can discover work and services displayed by vendors.',
      'Visitors can submit enquiries regarding services or projects.',
      'Vendors can register and create accounts.',
      'Vendors can upload portfolio and project work through their dashboard.',
      'Administrators can review and approve vendor-submitted work for public display.',
      'Administrators can assign vendors to client projects.',
      "Clients can access their client panel and view relevant project information, including assigned vendors and project status.",
    ],
    after: `Pikture Factory may modify, add, suspend, or discontinue Platform features from time to time.`,
  },
  {
    heading: '2. User Accounts',
    body: `Certain Platform features require registration.

Users agree to:`,
    list: [
      'Provide accurate and current information.',
      'Maintain the confidentiality of their login credentials.',
      'Keep their account information updated.',
      'Not share their account with unauthorised persons.',
      'Not impersonate another person or business.',
      'Not create accounts for fraudulent or unlawful purposes.',
    ],
    after: `Pikture Factory may suspend or terminate an account if it reasonably believes the account is being misused, contains inaccurate information, violates these Terms, or creates a security or legal risk.`,
  },
  {
    heading: '3. Vendor Registration',
    body: `Vendors may apply to join the Pikture Factory Platform through the vendor registration process.

Registration does not automatically guarantee acceptance as a vendor.

Pikture Factory may review vendor applications and may approve, reject, suspend, or request additional information at its discretion, subject to applicable law.

Vendors are responsible for ensuring that information submitted during registration is accurate.`,
  },
  {
    heading: '4. Vendor Portfolio Uploads',
    body: `Registered vendors may upload photographs, videos, project descriptions, service information, and other portfolio material through their vendor dashboard.

All uploaded material may be subject to administrative review.

Pikture Factory reserves the right to:`,
    list: [
      'Approve submitted content.',
      'Reject submitted content.',
      'Request changes.',
      'Remove previously approved content.',
      "Restrict or suspend a vendor's ability to upload content.",
    ],
    after: `Approval for display does not constitute a guarantee, certification, endorsement, or verification of every claim made by the vendor.`,
  },
  {
    heading: '5. Vendor Content and Intellectual Property',
    body: `Vendors retain ownership of content that they own and upload to the Platform.

By uploading content, the vendor grants Pikture Factory a non-exclusive, worldwide, royalty-free licence to host, reproduce, display, format, resize, adapt, and publicly present that content as reasonably necessary to operate, promote, and provide the Platform.

This licence includes displaying approved portfolio material on the website and related Pikture Factory marketing or promotional channels, subject to the vendor's rights and any separate agreement between the parties.

The vendor represents that:`,
    list: [
      'They own the content or have permission to use it.',
      "The content does not unlawfully infringe another person's intellectual property rights.",
      'They have obtained necessary permissions for identifiable persons appearing in the content where required.',
      'The content does not contain unlawful, defamatory, fraudulent, abusive, or malicious material.',
      "The content does not knowingly contain confidential information belonging to another party.",
    ],
    after: `Pikture Factory may remove content when it receives a legitimate complaint, legal notice, rights-holder request, or otherwise determines that removal is appropriate.`,
  },
  {
    heading: '6. Public Portfolio Display',
    body: `Only vendor content approved by the administrator may be displayed in public-facing sections of the Platform.

Pikture Factory does not guarantee that:`,
    list: [
      'Every vendor submission will be published.',
      'Every vendor will receive public visibility.',
      'Any particular portfolio submission will remain published indefinitely.',
      'Publicly displayed work will result in enquiries or business.',
    ],
    after: `Pikture Factory may change the presentation, ordering, categorisation, or visibility of portfolio content.`,
  },
  {
    heading: '7. Website Enquiries',
    body: `Visitors may submit enquiries through forms or popups displayed on the Platform.

Submitting an enquiry means that the information provided may be reviewed and used by Pikture Factory to understand the enquiry and facilitate communication with an appropriate vendor.

Pikture Factory does not guarantee:`,
    list: [
      'A response within a particular period.',
      'That an enquiry will result in a project.',
      'That a vendor will accept the enquiry.',
      'Any particular price, quality, availability, delivery time, or outcome.',
    ],
    after: `Any commercial arrangement ultimately entered into between a client and vendor may be subject to separate terms, quotations, agreements, invoices, or contracts.`,
  },
  {
    heading: '8. Vendor Assignment',
    body: `Pikture Factory administrators may assign a vendor to a client project based on availability, requirements, suitability, location, service category, or other operational considerations.

An assignment displayed within the client panel is intended to communicate the current project allocation.

Pikture Factory may change or reassign a vendor when reasonably necessary.

Vendor assignment does not by itself constitute a guarantee regarding project quality, completion date, price, or outcome unless expressly agreed in writing.`,
  },
  {
    heading: '9. Client Panel',
    body: `Clients may receive access to a client panel through which they can view relevant information about their project.

Depending on the Platform configuration, this may include:`,
    list: [
      'Assigned vendor',
      'Project/order status',
      'Project information',
      'Relevant updates',
      "Other information related to the client's project",
    ],
    after: `Clients must not share account access or confidential project information with unauthorised persons.`,
  },
  {
    heading: '10. Project Status',
    body: `Project statuses displayed through the Platform are intended to provide a general indication of progress.

Statuses may include stages such as:`,
    list: [
      'Enquiry received',
      'Pending',
      'Vendor assigned',
      'In progress',
      'Awaiting information',
      'Completed',
      'Cancelled',
    ],
    after: `The exact status terminology may change depending on the Platform's configuration.

A status displayed on the Platform does not override a separate written agreement between Pikture Factory, a vendor, or a client.`,
  },
  {
    heading: '11. Vendor-Client Relationship',
    body: `Where Pikture Factory connects a client with a vendor, the vendor may be responsible for providing the relevant service.

Unless expressly stated otherwise in a separate agreement, Pikture Factory does not guarantee the vendor's:`,
    list: [
      'Work quality',
      'Availability',
      'Pricing',
      'Delivery schedule',
      'Professional qualifications',
      'Performance',
      'Conduct',
      'Compliance with applicable laws',
      'Ability to complete a project',
    ],
    after: `Users should independently evaluate vendors and agree on project scope, pricing, timelines, deliverables, payment terms, cancellation terms, and other commercial conditions before engaging a vendor.`,
  },
  {
    heading: '12. Payments and Commercial Terms',
    body: `Where payments are made directly between clients and vendors, the applicable quotation, invoice, service agreement, or commercial arrangement between the parties will govern those payments.

Where Pikture Factory itself processes payments, additional payment, refund, cancellation, or service-specific terms may apply.

Nothing in these Terms should be interpreted as creating a refund entitlement where no such entitlement exists under the applicable agreement or law.

If the Platform later introduces online payment functionality, the relevant payment terms should be added to this section before launch.`,
  },
  {
    heading: '13. Prohibited Activities',
    body: `Users must not use the Platform to:`,
    list: [
      'Commit fraud or unlawful activity.',
      'Upload malicious software or harmful code.',
      'Attempt to gain unauthorised access to accounts or systems.',
      "Access another user's private information.",
      'Upload content that infringes intellectual property rights.',
      'Upload defamatory, obscene, threatening, hateful, or unlawful material.',
      'Submit false or misleading business or project information.',
      'Manipulate enquiries or Platform functionality.',
      'Spam other users.',
      'Scrape or systematically collect Platform data without permission.',
      'Circumvent security or access controls.',
      'Interfere with Platform operation.',
      'Use the Platform for purposes prohibited by applicable law.',
    ],
    after: `Pikture Factory may investigate suspected violations and take appropriate action.`,
  },
  {
    heading: '14. Intellectual Property of Pikture Factory',
    body: `Unless otherwise stated, the Platform and its original content, branding, logos, design, layout, text, graphics, software, functionality, and other materials are owned by or licensed to Pikture Factory.

Users may not reproduce, copy, modify, distribute, sell, reverse engineer, or commercially exploit Platform materials without prior written permission, except where permitted by applicable law.`,
  },
  {
    heading: '15. Accuracy of Information',
    body: `Pikture Factory aims to maintain accurate information on the Platform but does not guarantee that all information is complete, current, or error-free.

Vendor-provided information is the responsibility of the relevant vendor.

Users should verify important information directly with the relevant party before relying on it for a commercial decision.`,
  },
  {
    heading: '16. Availability of the Platform',
    body: `We aim to keep the Platform available and functioning properly but do not guarantee uninterrupted or error-free operation.

The Platform may occasionally be unavailable because of:`,
    list: [
      'Maintenance',
      'Updates',
      'Hosting issues',
      'Security incidents',
      'Network failures',
      'Third-party service outages',
      'Technical problems',
      'Events outside our reasonable control',
    ],
    after: `Pikture Factory may temporarily suspend access when reasonably necessary to protect users, data, systems, or the Platform.`,
  },
  {
    heading: '17. Third-Party Services and Links',
    body: `The Platform may contain links to or integrations with third-party services.

Pikture Factory does not control and is not responsible for third-party websites, applications, services, policies, availability, or content.

Users should review the applicable third-party terms and privacy policies before using those services.`,
  },
  {
    heading: '18. Disclaimer',
    body: `To the maximum extent permitted by applicable law, the Platform is provided on an "as available" basis.

Pikture Factory does not guarantee that:`,
    list: [
      'The Platform will always operate without interruption.',
      'Vendor information will always be accurate.',
      "Every vendor will meet a user's expectations.",
      'An enquiry will become a project.',
      'A project will be completed within a particular timeframe.',
      'A particular commercial outcome will be achieved.',
    ],
    after: `Nothing in these Terms excludes rights or protections that cannot lawfully be excluded under applicable law.`,
  },
  {
    heading: '19. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, Pikture Factory shall not be responsible for indirect, incidental, consequential, special, or punitive losses arising from the use of the Platform or dealings between users and vendors.

This includes, where legally permissible, losses relating to:`,
    list: [
      'Lost profits',
      'Lost business opportunities',
      'Loss of data',
      'Delays',
      'Vendor performance',
      'Project disputes',
      'Third-party services',
      "Unauthorised account access resulting from a user's failure to protect their credentials",
    ],
    after: `Nothing in these Terms limits liability that cannot legally be limited or excluded.`,
  },
  {
    heading: '20. Indemnification',
    body: `To the extent permitted by applicable law, users agree to indemnify and hold Pikture Factory and its authorised personnel harmless from claims, losses, liabilities, damages, costs, or expenses arising from:`,
    list: [
      'Their violation of these Terms.',
      'Their unlawful use of the Platform.',
      'Content uploaded by them.',
      "Infringement of another person's intellectual property or other rights.",
      'Fraudulent or misleading information supplied by them.',
      'Their dealings with other users or vendors.',
    ],
  },
  {
    heading: '21. Account Suspension and Termination',
    body: `Pikture Factory may suspend, restrict, or terminate access to an account where reasonably necessary, including where:`,
    list: [
      'These Terms are violated.',
      'False or fraudulent information is provided.',
      'Unlawful content is uploaded.',
      'The Platform is abused.',
      'Security is compromised.',
      'Continued access presents a legal, operational, or security risk.',
    ],
    after: `Where appropriate, users may contact Pikture Factory regarding the reason for a suspension or termination.`,
  },
  {
    heading: '22. Privacy',
    body: `Your use of the Platform is also subject to our Privacy Policy.

The Privacy Policy explains how personal information is collected, used, stored, and shared through the Platform.`,
  },
  {
    heading: '23. Changes to These Terms',
    body: `Pikture Factory may update these Terms from time to time.

Changes will be published on this page with an updated "Last Updated" date.

Where appropriate, significant changes may also be communicated through the Platform or other available communication channels.

Continued use of the Platform after updated Terms become effective constitutes acceptance of the revised Terms, subject to applicable law.`,
  },
  {
    heading: '24. Governing Law and Jurisdiction',
    body: `These Terms shall be governed by the applicable laws of India.

Subject to applicable law, disputes arising from these Terms or use of the Platform shall be subject to the jurisdiction of the courts having appropriate jurisdiction over Pikture Factory's registered/business location.

[Insert specific city/state jurisdiction after confirmation from the client.]`,
  },
  {
    heading: '25. Contact',
    body: `For questions relating to these Terms, please contact:`,
    contactCard: {
      lines: [
        ['Pikture Factory', null],
        ['Email', 'support@pikturefactory.in'],
        ['Phone', '+91 72043 39503'],
        ['Address', 'Kallumantapa, Ramamurthy Nagar, Bengaluru, Karnataka 560016'],
      ],
    },
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <LegalDocument
        eyebrow="Legal"
        title="Terms & Conditions"
        lastUpdated="19 August 2026"
        intro={`Welcome to Pikture Factory.

These Terms & Conditions ("Terms") govern your access to and use of the Pikture Factory website, vendor portal, client panel, and related services (collectively, the "Platform").

By accessing, registering on, uploading content to, or otherwise using the Platform, you agree to these Terms. If you do not agree with these Terms, please do not use the Platform.`}
        sections={SECTIONS}
      />
      <Footer />
    </>
  );
}
