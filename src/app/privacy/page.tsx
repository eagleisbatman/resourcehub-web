import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - ResourceHub",
  description: "Privacy Policy for ResourceHub - Digital Green Foundation",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-muted-foreground">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            ResourceHub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is an internal resource tracking and management system 
            operated by Digital Green Foundation and its sister concerns (collectively, &quot;Digital Green&quot;). 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our web application and mobile application (collectively, the &quot;Service&quot;).
          </p>
          <p>
            This Service is intended solely for use by authorized employees, contractors, and personnel 
            of Digital Green Foundation and its affiliated organizations. By using this Service, you 
            acknowledge that you are an authorized user and agree to the practices described in this 
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Authentication Information</h3>
          <p>
            We use Google OAuth for authentication. When you sign in, we collect:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email address (must be from an authorized domain)</li>
            <li>Name (as provided by your Google account)</li>
            <li>Profile picture (as provided by your Google account)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Resource Tracking Data</h3>
          <p>
            We collect and store information related to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Project assignments and allocations</li>
            <li>Resource availability and utilization</li>
            <li>Time tracking (planned and actual hours)</li>
            <li>Project status and flags</li>
            <li>Role assignments and permissions</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Usage Data</h3>
          <p>
            We may collect information about how you access and use the Service, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device information</li>
            <li>Browser type and version</li>
            <li>IP address</li>
            <li>Access times and dates</li>
            <li>Pages viewed and actions taken</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the Service</li>
            <li>Authenticate and authorize user access</li>
            <li>Track and manage resource allocations and project assignments</li>
            <li>Generate reports and analytics for resource utilization</li>
            <li>Communicate with you about your account and the Service</li>
            <li>Ensure security and prevent unauthorized access</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Information Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share 
            your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Within Digital Green:</strong> Information may be shared with authorized personnel 
              within Digital Green Foundation and its sister concerns who need access to perform their 
              job functions.
            </li>
            <li>
              <strong>Service Providers:</strong> We may share information with third-party service 
              providers who assist us in operating the Service (e.g., cloud hosting providers, database 
              services), subject to confidentiality agreements.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information if required by law, court 
              order, or government regulation, or to protect our rights, property, or safety.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of 
              assets, your information may be transferred as part of that transaction.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your 
            information against unauthorized access, alteration, disclosure, or destruction. These 
            measures include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication using OAuth 2.0</li>
            <li>Role-based access controls</li>
            <li>Regular security assessments and updates</li>
            <li>Restricted access to personal information</li>
          </ul>
          <p className="mt-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your information, we cannot 
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes 
            outlined in this Privacy Policy, unless a longer retention period is required or permitted 
            by law. When you cease to be an authorized user, we may retain certain information for 
            legitimate business purposes or as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights</h2>
          <p>As an authorized user, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and review your personal information</li>
            <li>Request correction of inaccurate or incomplete information</li>
            <li>Request deletion of your personal information (subject to legal and business requirements)</li>
            <li>Object to processing of your personal information</li>
            <li>Request restriction of processing</li>
            <li>Data portability (where applicable)</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact your system administrator or send a request to 
            the email address provided in the &quot;Contact Us&quot; section below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Third-Party Services</h2>
          <p>
            Our Service uses Google OAuth for authentication. When you sign in with Google, you are 
            subject to Google&apos;s Privacy Policy. We encourage you to review Google&apos;s Privacy Policy 
            to understand how they collect, use, and share your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            Our Service is not intended for individuals under the age of 18. We do not knowingly 
            collect personal information from children. If you believe we have collected information 
            from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; 
            date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p>
              <strong>Digital Green Foundation</strong>
            </p>
            <p>
              Email: <a href="mailto:gautam@digitalgreen.org" className="text-primary hover:underline">gautam@digitalgreen.org</a>
            </p>
            <p>
              For technical support or account-related inquiries, please contact your system administrator 
              or the IT department.
            </p>
          </div>
        </section>

        <section className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            This Privacy Policy applies solely to ResourceHub and does not extend to any external 
            websites or services that may be linked from our Service.
          </p>
        </section>
      </div>
    </div>
  );
}
