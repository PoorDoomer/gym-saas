"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  UserCheck, 
  Search, 
  QrCode,
  Clock,
  Users,
  Activity,
  Loader2
} from "lucide-react"
import { getRecentCheckIns, getCheckInStats, CheckIn, CheckInStats } from "@/lib/services/checkins"
import { QRScanner } from "@/components/QRScanner"
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function CheckInsPage() {
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  const [stats, setStats] = useState<CheckInStats>({
    currentOccupancy: 0,
    todayCheckIns: 0,
    peakHours: '6-8 PM',
    avgSessionDuration: '1.5h',
    growthFromYesterday: 0
  })
  const [loading, setLoading] = useState(true)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)
  const [manualCheckInOpen, setManualCheckInOpen] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch data on component mount
  useEffect(() => {
    loadData()
    loadMembers()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [checkInsData, statsData] = await Promise.all([
        getRecentCheckIns(10),
        getCheckInStats()
      ])
      setRecentCheckIns(checkInsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load check-in data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      // Get current gym ID from localStorage (for now)
      const gymId = localStorage.getItem('selectedGymId')
      if (!gymId) return

      const { data: membersData, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error loading members:', error)
      } else {
        setMembers(membersData || [])
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const handleQRScan = async (qrData: string) => {
    try {
      console.log('QR Code scanned:', qrData)
      
      // Parse QR data - expecting format like "member_id:MEMBER_ID" or just the member ID
      let memberId = qrData
      if (qrData.includes(':')) {
        memberId = qrData.split(':')[1]
      }

      // Perform check-in
      await performCheckIn(memberId, 'qr_scan')
      
    } catch (error) {
      console.error('Error processing QR scan:', error)
      alert('Failed to process QR code. Please try manual check-in.')
    }
  }

  const handleManualCheckIn = async () => {
    if (!selectedMember) {
      alert('Please select a member')
      return
    }

    try {
      await performCheckIn(selectedMember, 'manual')
      setManualCheckInOpen(false)
      setSelectedMember('')
    } catch (error) {
      console.error('Error performing manual check-in:', error)
      alert('Failed to check in member. Please try again.')
    }
  }

  const performCheckIn = async (memberId: string, method: 'qr_scan' | 'manual') => {
    try {
      const gymId = localStorage.getItem('selectedGymId')
      if (!gymId) {
        throw new Error('No gym selected')
      }

      // Create check-in record
      const { data, error } = await supabase
        .from('check_ins')
        .insert([{
          member_id: memberId,
          gym_id: gymId,
          check_in_time: new Date().toISOString(),
          check_in_method: method,
          location: 'Main Entrance'
        }])
        .select()

      if (error) {
        throw error
      }

      console.log('Check-in successful:', data)
      
      // Refresh data
      await loadData()
      
      // Show success message
      alert('Check-in successful!')
      
    } catch (error) {
      console.error('Error creating check-in:', error)
      throw error
    }
  }

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check-ins</h1>
              <p className="text-slate-600 dark:text-slate-400">Monitor member check-ins and gym occupancy</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="cursor-pointer" onClick={() => setQrScannerOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Scanner
              </Button>
              <Button className="cursor-pointer" onClick={() => setManualCheckInOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Manual Check-in
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentOccupancy}</div>
              <p className="text-xs text-muted-foreground">
                Members currently in gym
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stats.growthFromYesterday >= 0 ? "text-green-600" : "text-red-600"}>
                  {stats.growthFromYesterday >= 0 ? '+' : ''}{stats.growthFromYesterday}%
                </span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.peakHours}</div>
              <p className="text-xs text-muted-foreground">
                Busiest time today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSessionDuration}</div>
              <p className="text-xs text-muted-foreground">
                Average workout duration
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Check-in */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Check-in</CardTitle>
              <CardDescription>Check in a member manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search member by name or ID..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="w-full cursor-pointer" onClick={() => setManualCheckInOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Check In Member
              </Button>
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Or scan QR code</p>
                <Button variant="outline" className="w-full cursor-pointer" onClick={() => setQrScannerOpen(true)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Open QR Scanner
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Check-ins */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Latest member activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCheckIns.length === 0 ? (
                  <p className="text-center text-muted-foreground">No recent check-ins</p>
                ) : (
                  recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {checkIn.member ? 
                            `${checkIn.member.first_name[0]}${checkIn.member.last_name[0]}` : 
                            'M'
                          }
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {checkIn.member ? 
                              `${checkIn.member.first_name} ${checkIn.member.last_name}` : 
                              'Unknown Member'
                            }
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {checkIn.member?.email || 'Unknown Email'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !checkIn.check_out_time 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {!checkIn.check_out_time ? 'Active' : 'Checked Out'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {new Date(checkIn.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{checkIn.check_in_method.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Occupancy Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Occupancy</CardTitle>
            <CardDescription>Real-time gym occupancy throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Occupancy chart would go here</p>
                <p className="text-sm text-slate-500">Real-time data visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Dialog */}
      <QRScanner
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={handleQRScan}
        title="Member Check-in Scanner"
        description="Scan a member's QR code to check them in"
      />

      {/* Manual Check-in Dialog */}
      <Dialog open={manualCheckInOpen} onOpenChange={setManualCheckInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Check-in</DialogTitle>
            <DialogDescription>
              Select a member to check them in manually
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-search">Search Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="member-search"
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-select">Select Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} - {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredMembers.length === 0 && searchTerm && (
                <p className="text-sm text-muted-foreground">No members found matching "{searchTerm}"</p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setManualCheckInOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleManualCheckIn} className="flex-1" disabled={!selectedMember}>
                <UserCheck className="h-4 w-4 mr-2" />
                Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 