"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plane, Search, Fuel, Users, Gauge } from "lucide-react"

interface Aircraft {
  id: string
  name: string
  manufacturer: "Boeing" | "Airbus"
  type: "Narrow-body" | "Wide-body" | "Jumbo"
  wingspan: number
  length: number
  weight: number
  maxWeight: number
  seating: number
  crew: number
  fuelCapacity: number
  engines: number
  engineType: string
  maxAltitude: number
  maxSpeed: number
  range: number
}

export function AircraftDatabase() {
  const [searchTerm, setSearchTerm] = useState("")
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const aircraftData: Aircraft[] = [
    {
      id: "boeing-737-800",
      name: "Boeing 737-800",
      manufacturer: "Boeing",
      type: "Narrow-body",
      wingspan: 35.8,
      length: 39.5,
      weight: 41400,
      maxWeight: 79000,
      seating: 189,
      crew: 2,
      fuelCapacity: 29600,
      engines: 2,
      engineType: "CFM56-7B",
      maxAltitude: 12500,
      maxSpeed: 830,
      range: 5700,
    },
    {
      id: "boeing-747-8",
      name: "Boeing 747-8",
      manufacturer: "Boeing",
      type: "Jumbo",
      wingspan: 68.4,
      length: 76.3,
      weight: 220000,
      maxWeight: 448000,
      seating: 467,
      crew: 18,
      fuelCapacity: 240000,
      engines: 4,
      engineType: "GEnx-2B67",
      maxAltitude: 13100,
      maxSpeed: 920,
      range: 13400,
    },
    {
      id: "boeing-777-300er",
      name: "Boeing 777-300ER",
      manufacturer: "Boeing",
      type: "Wide-body",
      wingspan: 64.8,
      length: 73.9,
      weight: 168000,
      maxWeight: 351500,
      seating: 396,
      crew: 14,
      fuelCapacity: 181000,
      engines: 2,
      engineType: "GE90-115B",
      maxAltitude: 13100,
      maxSpeed: 905,
      range: 13500,
    },
    {
      id: "airbus-a320",
      name: "Airbus A320",
      manufacturer: "Airbus",
      type: "Narrow-body",
      wingspan: 35.8,
      length: 37.6,
      weight: 42000,
      maxWeight: 78000,
      seating: 180,
      crew: 8,
      fuelCapacity: 27000,
      engines: 2,
      engineType: "CFM56/V2500",
      maxAltitude: 12130,
      maxSpeed: 830,
      range: 6300,
    },
    {
      id: "airbus-a350-900",
      name: "Airbus A350-900",
      manufacturer: "Airbus",
      type: "Wide-body",
      wingspan: 64.8,
      length: 66.8,
      weight: 150000,
      maxWeight: 280000,
      seating: 325,
      crew: 12,
      fuelCapacity: 165000,
      engines: 2,
      engineType: "Trent XWB",
      maxAltitude: 13100,
      maxSpeed: 900,
      range: 15000,
    },
    {
      id: "airbus-a380",
      name: "Airbus A380-800",
      manufacturer: "Airbus",
      type: "Jumbo",
      wingspan: 79.8,
      length: 72.7,
      weight: 360000,
      maxWeight: 560000,
      seating: 550,
      crew: 22,
      fuelCapacity: 320000,
      engines: 4,
      engineType: "Trent 900",
      maxAltitude: 13100,
      maxSpeed: 910,
      range: 13300,
    },
  ]

  const filteredAircraft = aircraftData.filter((aircraft) => {
    const matchesSearch =
      aircraft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aircraft.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesManufacturer = manufacturerFilter === "all" || aircraft.manufacturer === manufacturerFilter
    const matchesType = typeFilter === "all" || aircraft.type === typeFilter

    return matchesSearch && matchesManufacturer && matchesType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Narrow-body":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Wide-body":
        return "bg-green-100 text-green-800 border-green-200"
      case "Jumbo":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Aircraft Database</CardTitle>
          <CardDescription className="font-serif">
            Explore detailed specifications of commercial aircraft
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search aircraft..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-serif"
              />
            </div>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-full md:w-48 font-serif">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                <SelectItem value="Boeing">Boeing</SelectItem>
                <SelectItem value="Airbus">Airbus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 font-serif">
                <SelectValue placeholder="Aircraft Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Narrow-body">Narrow-body</SelectItem>
                <SelectItem value="Wide-body">Wide-body</SelectItem>
                <SelectItem value="Jumbo">Jumbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Aircraft Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAircraft.map((aircraft) => (
          <Card key={aircraft.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-sans">{aircraft.name}</CardTitle>
                    <CardDescription className="font-serif">{aircraft.manufacturer}</CardDescription>
                  </div>
                </div>
                <Badge className={`${getTypeColor(aircraft.type)} font-serif`}>{aircraft.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-sm font-serif text-muted-foreground">Passengers</div>
                  <div className="font-bold font-sans">{aircraft.seating}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Gauge className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-sm font-serif text-muted-foreground">Max Speed</div>
                  <div className="font-bold font-sans">{aircraft.maxSpeed} km/h</div>
                </div>
              </div>

              {/* Detailed Specs */}
              <div className="space-y-2 text-sm font-serif">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wingspan:</span>
                  <span>{aircraft.wingspan} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span>{aircraft.length} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empty Weight:</span>
                  <span>{aircraft.weight.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Weight:</span>
                  <span>{aircraft.maxWeight.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Range:</span>
                  <span>{aircraft.range.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Ceiling:</span>
                  <span>{aircraft.maxAltitude.toLocaleString()} m</span>
                </div>
              </div>

              {/* Engine Info */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold font-sans">Propulsion</span>
                </div>
                <div className="text-sm font-serif space-y-1">
                  <div>
                    {aircraft.engines} × {aircraft.engineType}
                  </div>
                  <div className="text-muted-foreground">Fuel: {aircraft.fuelCapacity.toLocaleString()} L</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAircraft.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold font-sans mb-2">No aircraft found</h3>
            <p className="text-muted-foreground font-serif">Try adjusting your search terms or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
