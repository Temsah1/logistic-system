'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter,
  Edit,
  Trash2,
  LogOut,
  User,
  BarChart3,
  PieChart,
  TrendingUp as TrendingIcon,
  Calendar,
  MapPin,
  Activity
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts'

export default function AdminDashboard() {
  const [shipments, setShipments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [shipmentsResponse] = await Promise.all([
        api.get('/shipments')
      ])
      setShipments(shipmentsResponse.data.shipments)
      
      // Extract unique users from shipments
      const uniqueUsers = shipmentsResponse.data.shipments.reduce((acc, shipment) => {
        const user = typeof shipment.userId === 'object' ? shipment.userId : null
        if (user && !acc.find(u => u.id === user.id)) {
          acc.push(user)
        }
        return acc
      }, [])
      setUsers(uniqueUsers)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await api.put(`/shipments/${shipmentId}`, { status: newStatus })
      setShipments(shipments.map(shipment => 
        shipment.id === shipmentId 
          ? { ...shipment, status: newStatus, updatedAt: new Date() }
          : shipment
      ))
      toast.success('Shipment status updated successfully')
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update shipment status')
    }
  }

  const handleDeleteShipment = async (shipmentId) => {
    if (!confirm('Are you sure you want to delete this shipment?')) {
      return
    }

    try {
      await api.delete(`/shipments/${shipmentId}`)
      setShipments(shipments.filter(shipment => shipment.id !== shipmentId))
      toast.success('Shipment deleted successfully')
    } catch (error) {
      console.error('Failed to delete shipment:', error)
      toast.error('Failed to delete shipment')
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

  const filteredShipments = shipments.filter(shipment => {
    const userName = typeof shipment.userId === 'object' ? shipment.userId.name : ''
    const matchesSearch = shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.destination.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || shipment.status === statusFilter
    const matchesUser = !userFilter || (typeof shipment.userId === 'object' && shipment.userId.id.toString() === userFilter)
    return matchesSearch && matchesStatus && matchesUser
  })

  const stats = {
    totalShipments: shipments.length,
    totalUsers: users.length,
    pendingShipments: shipments.filter(s => s.status === 'Pending').length,
    deliveredShipments: shipments.filter(s => s.status === 'Delivered').length,
    totalRevenue: shipments.reduce((sum, s) => sum + s.cost, 0)
  }

  // Chart data preparation
  const statusData = [
    { name: 'Pending', value: stats.pendingShipments, color: '#F59E0B' },
    { name: 'Picked Up', value: shipments.filter(s => s.status === 'Picked Up').length, color: '#3B82F6' },
    { name: 'In Transit', value: shipments.filter(s => s.status === 'In Transit').length, color: '#8B5CF6' },
    { name: 'Delivered', value: stats.deliveredShipments, color: '#10B981' }
  ].filter(item => item.value > 0)

  // Revenue over time (last 6 months)
  const revenueData = []
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(new Date(), i)
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const monthRevenue = shipments
      .filter(s => {
        const shipmentDate = new Date(s.createdAt)
        return shipmentDate >= monthStart && shipmentDate <= monthEnd
      })
      .reduce((sum, s) => sum + s.cost, 0)
    
    revenueData.push({
      month: format(month, 'MMM yyyy'),
      revenue: monthRevenue,
      shipments: shipments.filter(s => {
        const shipmentDate = new Date(s.createdAt)
        return shipmentDate >= monthStart && shipmentDate <= monthEnd
      }).length
    })
  }

  // Shipments by destination
  const destinationData = shipments.reduce((acc, shipment) => {
    const city = shipment.destination.city
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {})

  const topDestinations = Object.entries(destinationData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <div className="ml-8 flex space-x-4">
                <Link
                  href="/admin"
                  className="text-primary-600 font-medium border-b-2 border-primary-600 px-1 py-4"
                >
                  Shipments
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 py-4"
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 py-4"
                >
                  Users
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name} (Admin)</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Shipments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalShipments}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingShipments}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.deliveredShipments}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Distribution Pie Chart */}
          <div className="card">
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Shipment Status Distribution</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend Line Chart */}
          <div className="card">
            <div className="flex items-center mb-4">
              <TrendingIcon className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Shipments Trend</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="shipments"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Shipments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Destinations Bar Chart */}
          <div className="card">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Top Destinations</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDestinations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Shipments</span>
                <span className="text-lg font-semibold text-gray-900">{stats.totalShipments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="text-lg font-semibold text-gray-900">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Shipments</span>
                <span className="text-lg font-semibold text-yellow-600">{stats.pendingShipments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivered This Month</span>
                <span className="text-lg font-semibold text-green-600">
                  {shipments.filter(s => {
                    const shipmentDate = new Date(s.createdAt)
                    const now = new Date()
                    return shipmentDate.getMonth() === now.getMonth() && 
                           shipmentDate.getFullYear() === now.getFullYear() &&
                           s.status === 'Delivered'
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Shipment Cost</span>
                <span className="text-lg font-semibold text-purple-600">
                  ${stats.totalShipments > 0 ? (stats.totalRevenue / stats.totalShipments).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>No shipments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {shipment.trackingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof shipment.userId === 'object' ? shipment.userId.name : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shipment.recipient.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shipment.destination.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={shipment.status}
                          onChange={(e) => handleStatusUpdate(shipment.id, e.target.value)}
                          className={`status-badge ${getStatusColor(shipment.status)} border-0 cursor-pointer`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${shipment.cost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(shipment.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/shipments/${shipment.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteShipment(shipment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
