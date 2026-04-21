'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Package, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../lib/api'

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.get(`/shipments/track/${trackingNumber}`)
      setShipment(response.data)
    } catch (error) {
      console.error('Tracking error:', error)
      setError(error.response?.data?.message || 'Shipment not found')
      setShipment(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending'
      case 'Picked Up':
        return 'status-picked-up'
      case 'In Transit':
        return 'status-in-transit'
      case 'Delivered':
        return 'status-delivered'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusProgress = (status) => {
    const steps = ['Pending', 'Picked Up', 'In Transit', 'Delivered']
    const currentIndex = steps.indexOf(status)
    return (currentIndex + 1) / steps.length * 100
  }

  const getStatusStep = (status) => {
    const steps = ['Pending', 'Picked Up', 'In Transit', 'Delivered']
    return steps.indexOf(status) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Shipment Tracking</h1>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Your Shipment</h2>
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="Enter tracking number (e.g., BST123ABC)"
                  className="input-field pl-10 text-lg font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Tracking...
                  </span>
                ) : (
                  'Track Shipment'
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </form>
        </div>

        {/* Shipment Results */}
        {shipment && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="card">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Tracking Number</h3>
                    <p className="text-2xl font-mono text-gray-900">{shipment.trackingNumber}</p>
                  </div>
                  <span className={`status-badge ${getStatusColor(shipment.status)}`}>
                    {shipment.status}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getStatusProgress(shipment.status)}%` }}
                  ></div>
                </div>
                
                {/* Status Steps */}
                <div className="grid grid-cols-4 gap-2">
                  {['Pending', 'Picked Up', 'In Transit', 'Delivered'].map((step, index) => (
                    <div
                      key={step}
                      className={`text-center p-2 rounded-lg ${
                        index < getStatusStep(shipment.status) - 1
                          ? 'bg-green-50 text-green-800'
                          : index === getStatusStep(shipment.status) - 1
                          ? 'bg-primary-50 text-primary-800'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <div className="text-xs font-medium">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Route</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Origin</h4>
                    <p className="text-gray-600">{shipment.origin.address}</p>
                    <p className="text-sm text-gray-500">
                      {shipment.origin.city}, {shipment.origin.postalCode}, {shipment.origin.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    shipment.status === 'Delivered' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      shipment.status === 'Delivered' ? 'bg-green-600' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Destination</h4>
                    <p className="text-gray-600">{shipment.destination.address}</p>
                    <p className="text-sm text-gray-500">
                      {shipment.destination.city}, {shipment.destination.postalCode}, {shipment.destination.country}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Recipient: {shipment.recipient.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Shipment Created</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(shipment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {shipment.status !== 'Pending' && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Picked Up</h4>
                      <p className="text-sm text-gray-600">Package has been picked up from origin</p>
                    </div>
                  </div>
                )}

                {shipment.status === 'In Transit' && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">In Transit</h4>
                      <p className="text-sm text-gray-600">Package is currently in transit</p>
                    </div>
                  </div>
                )}

                {shipment.status === 'Delivered' && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Delivered</h4>
                      <p className="text-sm text-gray-600">
                        Package has been delivered to recipient
                      </p>
                      {shipment.actualDelivery && (
                        <p className="text-sm text-gray-500">
                          {format(new Date(shipment.actualDelivery), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimated Delivery */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Estimated Delivery</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(shipment.estimatedDelivery), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShipment(null)
                  setTrackingNumber('')
                }}
                className="btn-secondary"
              >
                Track Another Shipment
              </button>
              <Link href="/login" className="btn-primary">
                Sign In for More Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
