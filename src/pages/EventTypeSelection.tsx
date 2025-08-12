import { useNavigate } from 'react-router-dom'
import { Ticket, Gift, ArrowRight, Users, DollarSign, Calendar, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EventTypeSelection() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-gray-600 mt-2">
                Choose the type of event you want to create
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard/events')}
              variant="outline"
              className="flex items-center gap-2"
            >
              Back to Events
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Free Event Option */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Event</h2>
              <p className="text-gray-600">Perfect for corporate events, meetups, and free gatherings</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Guest type management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Simple registration process</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Basic attendee tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">No payment processing</span>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => navigate('/dashboard/events/create/free')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full"
              >
                Create Free Event
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Ticketed Event Option */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Ticket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticketed Event</h2>
              <p className="text-gray-600">Ideal for paid events, conferences, and revenue-generating activities</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Multiple ticket types</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Revenue tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Payment processing</span>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => navigate('/dashboard/events/create/ticketed')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full"
              >
                Create Ticketed Event
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Feature Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">Free Events</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Guest type management</li>
                <li>✓ Simple registration</li>
                <li>✓ Basic attendee tracking</li>
                <li>✓ No payment processing</li>
                <li>✓ Corporate event friendly</li>
                <li>✓ Meetup and community events</li>
              </ul>
            </div>
            <div className="text-center border-l border-r border-gray-200 px-6">
              <h4 className="font-semibold text-gray-900 mb-4">Ticketed Events</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Multiple ticket types</li>
                <li>✓ Revenue tracking</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Payment processing</li>
                <li>✓ Conference and workshops</li>
                <li>✓ Revenue-generating activities</li>
              </ul>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-4">Both Include</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Event management</li>
                <li>✓ Attendee registration</li>
                <li>✓ Badge generation</li>
                <li>✓ Email notifications</li>
                <li>✓ Event analytics</li>
                <li>✓ Mobile check-in</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 