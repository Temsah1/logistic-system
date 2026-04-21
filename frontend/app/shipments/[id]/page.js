'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import api from '../../../lib/api'
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Scale, 
  Ruler, 
  Calendar,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ShipmentDetails({ params }) {
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchShipment()
  }, [params.id])

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${params.id}`)
      setShipment(response.data)
      setEditNotes(response.data.notes || '')
    } catch (error) {
      console.error('Failed to fetch shipment:', error)
      toast.error('Failed to load shipment details')
      router.push('/dashboard')
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

  const handleUpdateNotes = async () => {
    try {
      await api.put(`/shipments/${params.id}`, { notes: editNotes })
      setShipment({ ...shipment, notes: editNotes })
      setIsEditing(false)
      toast.success('Notes updated successfully')
    } catch (error) {
      console.error('Failed to update notes:', error)
      toast.error('Failed to update notes')
    }
  }

  const handleDeleteShipment = async () => {
    if (!confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/shipments/${params.id}`)
      toast.success('Shipment deleted successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete shipment:', error)
      toast.error('Failed to delete shipment')
    }
  }

  const getStatusProgress = (status) => {
    const steps = ['Pending', 'Picked Up', 'In Transit', 'Delivered']
    const currentIndex = steps.indexOf(status)
    return (currentIndex + 1) / steps.length * 100
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

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Shipment not found</p>
          <Link href="/dashboard" className="btn-primary mt-4 inline-block">
            Back to Dashboard
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Shipment Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              {user?.role === 'admin' && (
                <button
                  onClick={handleDeleteShipment}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              )}
              <Link
                href={`/track/${shipment.trackingNumber}`}
                className="btn-secondary"
              >
                Track Shipment
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Progress */}
        <div className="card">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-gray-900">Shipment Status</h2>
              <span className={`status-badge ${getStatusColor(shipment.status)}`}>
                {shipment.status}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStatusProgress(shipment.status)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Pending</span>
              <span>Picked Up</span>
              <span>In Transit</span>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tracking Number</label>
              <p className="text-lg font-mono text-gray-900">{shipment.trackingNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Cost</label>
              <p className="text-lg text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {shipment.cost}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
              <p className="text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(shipment.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Delivery</label>
              <p className="text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(shipment.estimatedDelivery), 'MMM dd, yyyy')}
              </p>
            </div>
            {shipment.actualDelivery && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Actual Delivery</label>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(shipment.actualDelivery), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              Origin
            </h3>
            <div className="space-y-2">
              <p className="text-gray-900">{shipment.origin.address}</p>
              <p className="text-gray-600">{shipment.origin.city}, {shipment.origin.postalCode}</p>
              <p className="text-gray-600">{shipment.origin.country}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              Destination
            </h3>
            <div className="space-y-2">
              <p className="text-gray-900">{shipment.destination.address}</p>
              <p className="text-gray-600">{shipment.destination.city}, {shipment.destination.postalCode}</p>
              <p className="text-gray-600">{shipment.destination.country}</p>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            Recipient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900">{shipment.recipient.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <p className="text-gray-900 flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {shipment.recipient.phone}
              </p>
            </div>
            {shipment.recipient.email && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {shipment.recipient.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Package Information */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            Package Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Weight</label>
              <p className="text-gray-900 flex items-center">
                <Scale className="h-4 w-4 mr-1" />
                {shipment.package.weight} kg
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Dimensions</label>
              <p className="text-gray-900 flex items-center">
                <Ruler className="h-4 w-4 mr-1" />
                {shipment.package.dimensions.length} × {shipment.package.dimensions.width} × {shipment.package.dimensions.height} cm
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              <p className="text-gray-900">{shipment.package.description}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notes</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center text-primary-600 hover:text-primary-800"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Add notes about this shipment..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateNotes}
                  className="btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditNotes(shipment.notes || '')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-900 whitespace-pre-wrap">
              {shipment.notes || 'No notes added yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
