"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FlightSimulator } from "@/components/flight-simulator"
import { PhysicsEducation } from "@/components/physics-education"
import { AircraftDatabase } from "@/components/aircraft-database"
import { Plane, BookOpen, Calculator, Database, Gauge, Wind, Target, CheckCircle } from "lucide-react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("simulator")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Plane className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-sans text-foreground">AeroPhysics Simulator</h1>
                <p className="text-sm text-muted-foreground font-serif">
                  Interactive Flight Physics Education Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-serif">
                <Calculator className="h-3 w-3 mr-1" />
                Physics Engine
              </Badge>
              <Badge variant="outline" className="font-serif">
                <Wind className="h-3 w-3 mr-1" />
                Real-time Simulation
              </Badge>
              <Badge variant="default" className="font-serif">
                <BookOpen className="h-3 w-3 mr-1" />
                Educational
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="py-16 bg-gradient-to-br from-background via-muted/20 to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-sans text-foreground mb-6">
            Master the Physics of Flight
          </h2>
          <p className="text-xl text-muted-foreground font-serif max-w-3xl mx-auto mb-8 leading-relaxed">
            Learn aerodynamics through guided tutorials and interactive simulations. Understand how Bernoulli's
            principle, lift, drag, and thrust work together. Perfect for students, pilots, and aviation enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="font-serif" onClick={() => setActiveTab("simulator")}>
              <Gauge className="h-5 w-5 mr-2" />
              Start Guided Tutorial
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-serif bg-transparent"
              onClick={() => setActiveTab("education")}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Learn Physics Concepts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-4 bg-card/50 rounded-lg border border-border">
              <Target className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold font-sans mb-2">Guided Tutorials</h3>
              <p className="text-sm font-serif text-muted-foreground">
                Step-by-step learning with real-time feedback and explanations
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border">
              <Calculator className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold font-sans mb-2">Interactive Physics</h3>
              <p className="text-sm font-serif text-muted-foreground">
                See how parameter changes affect flight forces in real-time
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border">
              <CheckCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold font-sans mb-2">Progress Tracking</h3>
              <p className="text-sm font-serif text-muted-foreground">
                Track your learning progress with quizzes and practical scenarios
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="simulator" className="font-serif">
              <Gauge className="h-4 w-4 mr-2" />
              Flight Simulator
            </TabsTrigger>
            <TabsTrigger value="education" className="font-serif">
              <BookOpen className="h-4 w-4 mr-2" />
              Physics Education
            </TabsTrigger>
            <TabsTrigger value="aircraft" className="font-serif">
              <Database className="h-4 w-4 mr-2" />
              Aircraft Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulator" className="space-y-6">
            <FlightSimulator />
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <PhysicsEducation />
          </TabsContent>

          <TabsContent value="aircraft" className="space-y-6">
            <AircraftDatabase />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold font-sans text-foreground mb-4">AeroPhysics Simulator</h3>
              <p className="text-muted-foreground font-serif leading-relaxed">
                An educational platform for understanding the fundamental physics principles that govern flight.
              </p>
            </div>
            <div>
              <h4 className="font-semibold font-sans text-foreground mb-4">Physics Concepts</h4>
              <ul className="space-y-2 text-muted-foreground font-serif">
                <li>Bernoulli's Principle</li>
                <li>Lift & Drag Forces</li>
                <li>Thrust & Weight</li>
                <li>Moment & Torque</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-sans text-foreground mb-4">Simulation Features</h4>
              <ul className="space-y-2 text-muted-foreground font-serif">
                <li>Real-time Physics Engine</li>
                <li>Interactive Parameter Control</li>
                <li>Aircraft Performance Data</li>
                <li>Educational Visualizations</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground font-serif">
              © 2025 AeroPhysics Simulator. Built for educational purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
