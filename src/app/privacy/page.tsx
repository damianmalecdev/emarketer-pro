export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-4">
            Last updated: October 4, 2025
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Welcome to eMarketer.pro. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you about how we look after your personal data and tell you about your privacy rights.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Data We Collect</h2>
          <p className="text-gray-700 mb-4">
            We may collect, use, store and transfer different kinds of personal data about you:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Identity Data: name, username, email address</li>
            <li>Contact Data: email address and telephone numbers</li>
            <li>Technical Data: IP address, browser type and version, time zone setting</li>
            <li>Usage Data: information about how you use our website and services</li>
            <li>Marketing and advertising data from Meta, Google Ads, and Google Analytics</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Data</h2>
          <p className="text-gray-700 mb-4">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our service</li>
            <li>To monitor the usage of our service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
            used or accessed in an unauthorized way, altered or disclosed.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            We integrate with third-party services including:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Meta (Facebook) Marketing API</li>
            <li>Google Ads API</li>
            <li>Google Analytics 4</li>
            <li>OpenAI API</li>
          </ul>
          <p className="text-gray-700 mb-4">
            These services have their own privacy policies addressing how they use such information.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
            including for the purposes of satisfying any legal, accounting, or reporting requirements.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
          <p className="text-gray-700 mb-4">
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Request access to your personal data</li>
            <li>Request correction of your personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
            <li>Request transfer of your personal data</li>
            <li>Right to withdraw consent</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700 mb-4">
            Email: <a href="mailto:privacy@emarketer.pro" className="text-blue-600 hover:underline">privacy@emarketer.pro</a>
          </p>
        </div>
      </div>
    </div>
  )
}

