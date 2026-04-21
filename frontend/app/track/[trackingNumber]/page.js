'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Package, MapPin, Calendar, ArrowRight, Home } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../../lib/api'

export default function PublicTrackPage({ params }) {
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchShipment()
  }, [params.trackingNumber])

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/track/${params.trackingNumber}`)
      setShipment(response.data)
    } catch (error) {
      console.error('Tracking error:', error)
      setError(error.response?.data?.message || 'Shipment not found')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipment details...</p>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Shipment Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The tracking number you entered is not valid.'}</p>
          <Link href="/track" className="btn-primary">
            Track Another Shipment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center">
              <Home className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-600 hover:text-gray-900">Home</span>
            </Link>
            <div className="mx-2 text-gray-400">/</div>
            <Link href="/track" className="text-gray-600 hover:text-gray-900">
              Tracking
            </Link>
            <div className="mx-2 text-gray-400">/</div>
            <span className="text-gray-900 font-medium">{shipment.trackingNumber}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        <div className="card mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipment Tracking</h2>
                <p className="text-lg font-mono text-gray-900">{shipment.trackingNumber}</p>
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
        <div className="card mb-8">
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
        <div className="card mb-8">
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
          <Link href="/track" className="btn-secondary">
            Track Another Shipment
          </Link>
          <Link href="/login" className="btn-primary">
            Sign In for More Details
          </Link>
        </div>
      </div>
    </div>
  )
}
