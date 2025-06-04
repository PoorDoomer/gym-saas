'use client';

import { useEffect, useState } from 'react';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Smartphone,
  CheckCircle,
  Star,
  ArrowRight,
  Dumbbell,
  Globe,
  Menu,
  X
} from "lucide-react"
import { useRegionDetection } from '@/lib/hooks/useRegionDetection';

export default function HomePageClient() {
  const { region, formatCurrency, changeRegion, supportedRegions } = useRegionDetection();
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mobileMenu = document.getElementById('mobile-menu');
      const menuButton = document.getElementById('mobile-menu-button');
      
      if (mobileMenuOpen && 
          mobileMenu && 
          !mobileMenu.contains(event.target as Node) &&
          menuButton && 
          !menuButton.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">FitLife</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer">
                Testimonials
              </Link>
              
              {/* Auto-detected Region Selector */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRegionSelector(!showRegionSelector)}
                  className="flex items-center space-x-1 cursor-pointer"
                >
                  <Globe className="h-4 w-4" />
                  <span>{region?.language || 'English'}</span>
                </Button>
                
                {showRegionSelector && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <p className="text-xs text-slate-500 mb-2">Auto-detected: {region?.country}</p>
                      {Object.entries(supportedRegions).map(([locale, regionInfo]) => (
                        <button
                          key={locale}
                          onClick={() => {
                            changeRegion(locale);
                            setShowRegionSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                            region?.locale === locale ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {regionInfo.language} ({regionInfo.country})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/login">
                <Button variant="outline" className="cursor-pointer">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="cursor-pointer">Get Started</Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="cursor-pointer">Login</Button>
              </Link>
              <button
                id="mobile-menu-button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="lg:hidden mt-4 pb-4 border-t border-slate-200 dark:border-slate-700">
              <div className="pt-4 space-y-4">
                <Link 
                  href="#features" 
                  className="block text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#pricing" 
                  className="block text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="#testimonials" 
                  className="block text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </Link>
                
                {/* Region Selector Mobile */}
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowRegionSelector(!showRegionSelector)}
                    className="w-full justify-start cursor-pointer"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    <span>{region?.language || 'English'}</span>
                  </Button>
                  
                  {showRegionSelector && (
                    <div className="mt-2 w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2">
                      <p className="text-xs text-slate-500 mb-2">Auto-detected: {region?.country}</p>
                      {Object.entries(supportedRegions).map(([locale, regionInfo]) => (
                        <button
                          key={locale}
                          onClick={() => {
                            changeRegion(locale);
                            setShowRegionSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                            region?.locale === locale ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {regionInfo.language} ({regionInfo.country})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <Link href="/signup" className="block">
                    <Button className="w-full cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6">
            Manage Your Gym
            <span className="text-blue-600 block">Like a Pro</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Complete gym management solution with member tracking, class scheduling, 
            payments, and analytics. Everything you need to run a successful fitness business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto cursor-pointer">
                Start now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto cursor-pointer">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Powerful features designed specifically for gym owners and fitness professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center sm:text-left">
                <Users className="h-12 w-12 text-blue-600 mb-4 mx-auto sm:mx-0" />
                <CardTitle>Member Management</CardTitle>
                <CardDescription>
                  Complete member profiles, membership plans, and automated renewals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center sm:text-left">
                <Calendar className="h-12 w-12 text-green-600 mb-4 mx-auto sm:mx-0" />
                <CardTitle>Class Scheduling</CardTitle>
                <CardDescription>
                  Easy class booking, trainer management, and capacity tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center sm:text-left">
                <CreditCard className="h-12 w-12 text-purple-600 mb-4 mx-auto sm:mx-0" />
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>
                  Secure payments, automated billing, and financial reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center sm:text-left">
                <BarChart3 className="h-12 w-12 text-orange-600 mb-4 mx-auto sm:mx-0" />
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Detailed insights on revenue, attendance, and member retention
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center sm:text-left">
                <Smartphone className="h-12 w-12 text-red-600 mb-4 mx-auto sm:mx-0" />
                <CardTitle>Mobile Check-in</CardTitle>
                <CardDescription>
                  QR code scanning, contactless entry, and real-time occupancy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center sm:text-left">
                <Shield className="h-12 w-12 text-indigo-600 mb-4 mx-auto sm:mx-0" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Enterprise-grade security with 99.9% uptime guarantee
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section with Dynamic Currency */}
      <section id="pricing" className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300">
              Choose the plan that fits your gym size and needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-blue-200 transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold text-blue-600">{formatCurrency(29)}</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Up to 100 members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Basic reporting
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Email support
                  </li>
                </ul>
                <Button className="w-full mt-6 cursor-pointer">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 relative hover:border-blue-600 transition-colors cursor-pointer">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">Most Popular</span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold text-blue-600">{formatCurrency(79)}</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Up to 500 members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Custom branding
                  </li>
                </ul>
                <Button className="w-full mt-6 cursor-pointer">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-blue-600">{formatCurrency(199)}</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Unlimited members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    White-label solution
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    24/7 phone support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    API access
                  </li>
                </ul>
                <Button className="w-full mt-6 cursor-pointer">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-12 sm:py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by Gym Owners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="border-0 shadow-lg cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "FitLife has transformed how we manage our gym. The automated billing alone saves us 10 hours per week!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    JS
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">John Smith</p>
                    <p className="text-sm text-slate-500">Owner, PowerFit Gym</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "The member check-in system is fantastic. Our members love the convenience and we love the data insights."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    MJ
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Maria Johnson</p>
                    <p className="text-sm text-slate-500">Manager, Elite Fitness</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "Best investment we've made for our business. The analytics help us make data-driven decisions every day."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    DW
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">David Wilson</p>
                    <p className="text-sm text-slate-500">Owner, FitZone</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Gym?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of gym owners who have streamlined their operations with FitLife
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-6 sm:px-8 py-4 sm:py-6 cursor-pointer">
              Start now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Dumbbell className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">FitLife</span>
              </div>
              <p className="text-slate-400">
                The complete gym management solution for modern fitness businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#features" className="hover:text-white cursor-pointer">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white cursor-pointer">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white cursor-pointer">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-white cursor-pointer">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white cursor-pointer">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white cursor-pointer">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/about" className="hover:text-white cursor-pointer">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white cursor-pointer">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white cursor-pointer">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-slate-400">
            <p>&copy; 2024 FitLife. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 