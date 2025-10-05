import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Trash2, Shield, Clock } from 'lucide-react'

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Deletion Request
          </h1>
          <p className="text-xl text-gray-600">
            How to delete your data from eMarketer.pro
          </p>
        </div>

        {/* Main Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Trash2 className="mr-3 h-6 w-6 text-red-600" />
              Delete Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-lg text-gray-800 leading-relaxed">
                To permanently delete your data from eMarketer.pro, please contact us at{' '}
                <a 
                  href="mailto:kontakt@emarketer.pro" 
                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  kontakt@emarketer.pro
                </a>
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <Shield className="mr-2 h-5 w-5 text-green-600" />
                What Gets Deleted?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you request data deletion, we will permanently remove:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All Meta Ads campaigns data</li>
                <li>Ad sets and ad account details</li>
                <li>Campaign insights and performance metrics</li>
                <li>Integration access tokens</li>
                <li>Any cached or stored Platform Data</li>
              </ul>
            </div>

            <div className="pt-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-orange-600" />
                Timeline
              </h3>
              <p className="text-gray-700 leading-relaxed">
                All Meta-related data will be deleted from our systems <strong>within 30 days</strong> of your request. 
                The deletion process is manual and verified to ensure that all Platform Data is permanently removed 
                from our database and backups.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-purple-600" />
                How to Request Deletion
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Users can request deletion of their data by:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Visiting this page: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://emarketer.pro/data-deletion</code></li>
                  <li>Sending an email to <a href="mailto:kontakt@emarketer.pro" className="text-blue-600 hover:text-blue-800 underline font-semibold">kontakt@emarketer.pro</a></li>
                </ol>
                <p className="leading-relaxed mt-4">
                  Please include your account email address in your deletion request to help us identify your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
            <p className="mb-4">
              If you have any questions about data deletion, please contact us
            </p>
            <a 
              href="mailto:kontakt@emarketer.pro"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Mail className="mr-2 h-5 w-5" />
              kontakt@emarketer.pro
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              Return to eMarketer.pro
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
