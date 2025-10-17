"use client"

import { useState, useEffect, useRef,useMemo} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, AlertTriangle, Lightbulb, BookOpen, Target, CheckCircle } from "lucide-react"

// 필요한 Three.js/React Three Fiber 라이브러리 import
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Environment, 
  useGLTF, 
  Cloud, 
  Sky, 
  useHelper 
} from '@react-three/drei'
import { Vector3, ArrowHelper, DirectionalLightHelper } from 'three'
import { Physics, useBox, usePlane } from '@react-three/cannon'
import * as THREE from 'three'

// 타입 정의 추가
interface AircraftModelProps {
  modelPath: string;
  rotation: [number, number, number];
  position: [number, number, number];
}

interface ParticlesProps {
  count: number;
  size: number;
  color: string;
  speed: number;
  turbulence?: number;
}

// 3D 모델 컴포넌트
function AircraftModel({ modelPath, rotation, position, angleOfAttack, throttle, isStalling }: {
  modelPath: string;
  rotation: [number, number, number];
  position: [number, number, number];
  angleOfAttack: number;
  throttle: number;
  isStalling: boolean;
}) {
  const { scene } = useGLTF(modelPath)
  
  // 모델 색상 변경 (stall 상태에 따라)
  useEffect(() => {
    if (scene && isStalling) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          // stall 상태일 때만 색상 변경
          child.material.color.set('#EF4444'); // 빨간색 (stall 상태)
        }
      });
    } else if (scene) {
      // 원래 색상으로 복원
      scene.traverse((child: any) => {
        if (child.isMesh && child.material.originalColor) {
          child.material.color.copy(child.material.originalColor);
        }
      });
    }
  }, [scene, isStalling]);

  // 초기 로드 시 원래 색상 저장
  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          // 원래 색상 저장
          if (!child.material.originalColor) {
            child.material.originalColor = child.material.color.clone();
          }
        }
      });
    }
  }, [scene]);

  const isHotAirBalloon = modelPath.includes('hot_air_balloon');

  return (
    <group>
      {/* 모델 렌더링 */}
      <primitive 
        object={scene} 
        position={position}
        // 열기구인 경우 공격각 무시
        rotation={[
          isHotAirBalloon ? 0 : angleOfAttack * (Math.PI / 180), // X축 (pitch)
          rotation[1], // Y축 (yaw)
          rotation[2]  // Z축 (roll)
        ]}
        scale={[0.05, 0.05, 0.05]}
      />
      
      {/* 열기구가 아닌 경우에만 추력 시각화 */}
      {!isHotAirBalloon && throttle > 30 && (
        <mesh position={[position[0] - 0.5, position[1], position[2]]}>
          <coneGeometry args={[0.05, throttle / 500, 16]} />
          <meshBasicMaterial color={throttle > 70 ? "#FF4500" : "#FFA500"} />
        </mesh>
      )}
      
      {/* 양력, 항력, 중력 시각화 (벡터 화살표) */}
      <group>
        {/* 양력 벡터 (녹색 화살표, 위쪽) */}
        <mesh position={[position[0], position[1] + 0.2, position[2]]} rotation={[0, 0, 0]}>
          <arrowHelper args={[new Vector3(0, 1, 0), new Vector3(0, 0, 0), 0.5, 0x10B981]} />
        </mesh>
        
        {/* 항력 벡터 (빨간색 화살표, 뒤쪽) */}
        <mesh position={[position[0], position[1], position[2]]} rotation={[0, 0, 0]}>
          <arrowHelper args={[new Vector3(-1, 0, 0), new Vector3(0, 0, 0), 0.3, 0xEF4444]} />
        </mesh>
      </group>
    </group>
  )
}

interface FlightParameters {
  airspeed: number // km/h
  angleOfAttack: number // degrees
  altitude: number // meters
  throttle: number // percentage
  weight: number // kg
  wingArea: number // m²
  liftCoefficient: number
  dragCoefficient: number
}

interface Forces {
  lift: number
  drag: number
  thrust: number
  weight: number
}

const tutorialSteps = [
  {
    id: 1,
    title: "Understanding Airspeed",
    description:
      "Airspeed is crucial for generating lift. Try increasing airspeed from 100 to 300 km/h and observe how lift increases.",
    target: "airspeed",
    minValue: 250,
    explanation:
      "Higher airspeed means more air flowing over the wings, creating greater lift according to the formula L = ½ρv²ACₗ",
  },
  {
    id: 2,
    title: "Angle of Attack Effects",
    description:
      "Adjust the angle of attack between 0° and 10°. Notice how lift increases, but be careful not to exceed 15°!",
    target: "angleOfAttack",
    minValue: 8,
    maxValue: 12,
    explanation:
      "Increasing angle of attack deflects more air downward, creating more lift until the critical angle where stall occurs.",
  },
  {
    id: 3,
    title: "Stall Recognition",
    description:
      "Carefully increase angle of attack beyond 15° to experience a stall. Watch how lift drops dramatically!",
    target: "angleOfAttack",
    minValue: 16,
    explanation:
      "At high angles of attack, airflow separates from the wing's upper surface, causing a sudden loss of lift.",
  },
  {
    id: 4,
    title: "Altitude Effects",
    description: "Change altitude from sea level to 10,000m. Notice how thinner air affects lift generation.",
    target: "altitude",
    minValue: 8000,
    explanation:
      "Air density decreases with altitude, requiring higher speeds or larger angles of attack to maintain the same lift.",
  },
  {
    id: 5,
    title: "Thrust vs Drag Balance - Flight Analysis",
    description:
      "Observe how thrust and drag forces interact. Try different throttle settings and watch the real-time balance analysis below.",
    target: "throttle",
    explanation:
      "For steady flight, thrust must equal drag. This is an ongoing analysis - experiment with different settings to understand force relationships.",
    isInformational: true,
  },
]

export function FlightSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedAircraft, setSelectedAircraft] = useState("boeing-737")
  const [parameters, setParameters] = useState<FlightParameters>({
    airspeed: 250,
    angleOfAttack: 5,
    altitude: 3000,
    throttle: 75,
    weight: 41400,
    wingArea: 125,
    liftCoefficient: 1.2,
    dragCoefficient: 0.025,
  })

  const [forces, setForces] = useState<Forces>({
    lift: 0,
    drag: 0,
    thrust: 0,
    weight: 0,
  })

  const [position, setPosition] = useState({ x: 400, y: 300, rotation: 0 })
  const [velocity, setVelocity] = useState({ x: 0, y: 0, angular: 0 })
  const [isStalling, setIsStalling] = useState(false)
  const [currentTutorial, setCurrentTutorial] = useState<number>(0)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showHints, setShowHints] = useState(true)
  const [parameterFeedback, setParameterFeedback] = useState<string>("")
  const [currentTips, setCurrentTips] = useState<string[]>([])
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)
  const [selectedModel, setSelectedModel] = useState("/3d/boeing_737_american_airlines.glb")
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState("");
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCompletedStepsRef = useRef<number[]>([]);
  
  // 항공기 프리셋에 3D 모델 경로 추가
  const aircraftPresets = {
    "boeing-737": { 
      weight: 41400, 
      wingArea: 125, 
      name: "Boeing 737-800",
      modelPath: "/3d/boeing_737_american_airlines.glb" // 경로 수정
    },
    "f16": { 
      weight: 8900, 
      wingArea: 27.9, 
      name: "F-16 Falcon",
      modelPath: "/3d/f16-c_falcon.glb" // 경로 수정
    },
    "b1": { 
      weight: 86000, 
      wingArea: 181, 
      name: "B-1 Lancer",
      modelPath: "/3d/b1.glb" // 경로 수정
    },
    "p51": { 
      weight: 3465, 
      wingArea: 21.6, 
      name: "P-51 Mustang",
      modelPath: "/3d/p51.glb" // 경로 수정
    },
    // 열기구 추가
    "hot-air-balloon": {
      weight: 800, // 열기구의 대략적인 무게 (kg)
      wingArea: 500, // 열기구의 표면적 (m²)
      name: "Hot Air Balloon",
      modelPath: "/3d/hot_air_balloon.glb"
    },
    // 다른 항공기 추가...
  }

  // Physics calculations
  useEffect(() => {
    const airDensity = 1.225 * Math.exp(-parameters.altitude / 8400) // Air density at altitude
    const velocityMs = parameters.airspeed / 3.6 // Convert km/h to m/s

    // Check for stall condition
    const criticalAngle = 15
    const stalling = parameters.angleOfAttack > criticalAngle
    setIsStalling(stalling)

    // Calculate forces
    const dynamicPressure = 0.5 * airDensity * velocityMs * velocityMs

    let lift = dynamicPressure * parameters.wingArea * parameters.liftCoefficient
    if (stalling) {
      lift *= 0.3 // Dramatic lift reduction in stall
    }

    const drag = dynamicPressure * parameters.wingArea * parameters.dragCoefficient
    const thrust = (parameters.throttle / 100) * 120000 // Max thrust in Newtons
    const weight = parameters.weight * 9.81 // Convert to Newtons

    setForces({ lift, drag, thrust, weight })
  }, [parameters])

  // Animation loop
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setPosition((prev) => {
        const dt = 0.1 // Time step
        const mass = parameters.weight

        // Net forces
        const netVertical = forces.lift - forces.weight
        const netHorizontal = forces.thrust - forces.drag

        // Accelerations
        const accelX = netHorizontal / mass
        const accelY = -netVertical / mass // Negative because up is negative Y

        // Update velocity
        const newVelX = velocity.x + accelX * dt
        const newVelY = velocity.y + accelY * dt

        // Update position
        const newX = Math.max(50, Math.min(750, prev.x + newVelX * dt * 100))
        const newY = Math.max(50, Math.min(550, prev.y + newVelY * dt * 100))

        // Update rotation based on angle of attack and flight path
        const newRotation = parameters.angleOfAttack * (Math.PI / 180)

        setVelocity({ x: newVelX, y: newVelY, angular: 0 })

        return { x: newX, y: newY, rotation: newRotation }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isRunning, forces, velocity, parameters.angleOfAttack, parameters.weight])

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#E0F6FF")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw ground
    ctx.fillStyle = "#8B7355"
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50)

    // Draw aircraft
    ctx.save()
    ctx.translate(position.x, position.y)
    ctx.rotate(position.rotation)

    // Aircraft body
    ctx.fillStyle = isStalling ? "#EF4444" : "#3B82F6"
    ctx.fillRect(-30, -5, 60, 10)

    // Wings
    ctx.fillStyle = isStalling ? "#DC2626" : "#1E40AF"
    ctx.fillRect(-15, -20, 30, 40)

    // Nose
    ctx.beginPath()
    ctx.moveTo(30, 0)
    ctx.lineTo(40, -3)
    ctx.lineTo(40, 3)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Draw force vectors
    const scale = 0.0001

    // Lift (green, upward)
    if (forces.lift > 0) {
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x, position.y - forces.lift * scale)
      ctx.stroke()

      ctx.fillStyle = "#10B981"
      ctx.font = "12px sans-serif"
      ctx.fillText(`Lift: ${Math.round(forces.lift)}N`, position.x + 10, position.y - forces.lift * scale)
    }

    // Drag (red, backward)
    if (forces.drag > 0) {
      ctx.strokeStyle = "#EF4444"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x - forces.drag * scale * 2, position.y)
      ctx.stroke()

      ctx.fillStyle = "#EF4444"
      ctx.font = "12px sans-serif"
      ctx.fillText(`Drag: ${Math.round(forces.drag)}N`, position.x - forces.drag * scale * 2 - 60, position.y - 10)
    }

    // Thrust (blue, forward)
    if (forces.thrust > 0) {
      ctx.strokeStyle = "#3B82F6"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x + forces.thrust * scale * 2, position.y)
      ctx.stroke()

      ctx.fillStyle = "#3B82F6"
      ctx.font = "12px sans-serif"
      ctx.fillText(
        `Thrust: ${Math.round(forces.thrust)}N`,
        position.x + forces.thrust * scale * 2 + 10,
        position.y - 10,
      )
    }

    // Weight (orange, downward)
    if (forces.weight > 0) {
      ctx.strokeStyle = "#F59E0B"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x, position.y + forces.weight * scale)
      ctx.stroke()

      ctx.fillStyle = "#F59E0B"
      ctx.font = "12px sans-serif"
      ctx.fillText(`Weight: ${Math.round(forces.weight)}N`, position.x + 10, position.y + forces.weight * scale)
    }
  }, [position, forces, isStalling])

  // Parameter change feedback system
  useEffect(() => {
    let feedback = ""
    const tips = []

    if (parameters.airspeed < 150) {
      feedback = "⚠️ Low airspeed - insufficient lift for most aircraft."
      tips.push("Increase speed or angle of attack to generate more lift")
      tips.push("Formula: Lift = ½ × air density × velocity² × wing area × lift coefficient")
    } else if (parameters.airspeed > 400) {
      feedback = "⚡ High speed flight - drag increases significantly."
      tips.push("Drag increases with velocity squared - doubling speed quadruples drag")
      tips.push("Consider reducing throttle to maintain efficient flight")
    }

    if (parameters.angleOfAttack > 12 && parameters.angleOfAttack <= 15) {
      feedback = "⚠️ Approaching critical angle of attack. Stall warning!"
      tips.push("Most aircraft stall between 15-18° angle of attack")
      tips.push("Reduce angle of attack or increase airspeed to maintain safe flight")
    } else if (parameters.angleOfAttack > 15) {
      feedback = "🚨 STALL CONDITION - Airflow separated from wing surface!"
      tips.push("Immediately reduce angle of attack and increase throttle")
      tips.push("In real flight, push the nose down to recover from stall")
    } else if (parameters.angleOfAttack < 0) {
      feedback = "📉 Negative angle of attack - aircraft will descend rapidly."
      tips.push("Negative angles create downward lift - useful for aerobatic maneuvers")
    }

    if (parameters.altitude > 8000) {
      feedback = "🏔️ High altitude - reduced air density affects performance."
      tips.push("Air density at 10,000m is about 26% of sea level density")
      tips.push("Higher speeds or larger angles needed to maintain same lift")
    }

    const thrustDragDiff = Math.abs(forces.thrust - forces.drag)
    const liftWeightDiff = Math.abs(forces.lift - forces.weight)

    if (thrustDragDiff < 5000 && liftWeightDiff < 10000) {
      feedback = "✅ Excellent! Forces are well balanced for steady flight."
      tips.push("This is ideal for cruise flight - minimal energy waste")
      tips.push("Small adjustments maintain altitude and speed efficiently")
    }

    setParameterFeedback(feedback)
    setCurrentTips(tips)
  }, [parameters, forces])

  useEffect(() => {
    if (!tutorialActive || currentTutorial >= tutorialSteps.length) return

    const step = tutorialSteps[currentTutorial]

    if (step.isInformational) return

    const currentValue = parameters[step.target as keyof FlightParameters]

    let completed = false
    if (step.minValue && step.maxValue) {
      completed = currentValue >= step.minValue && currentValue <= step.maxValue
    } else if (step.minValue) {
      completed = currentValue >= step.minValue
    }

    if (completed && !completedSteps.includes(step.id)) {
      setCompletedSteps((prev) => [...prev, step.id])
      setTimeout(() => {
        if (currentTutorial < tutorialSteps.length - 1) {
          setCurrentTutorial((prev) => prev + 1)
        }
      }, 2000)
    }
  }, [parameters, currentTutorial, tutorialActive, completedSteps])

  // 음성 안내 유틸리티
  const speakText = (text: string, rate = 1, pitch = 1, volume = 1) => {
    // 브라우저에서 실행 중인지 확인
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 이미 말하고 있는 경우 중지
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;     // 0.1 ~ 10
      utterance.pitch = pitch;   // 0 ~ 2
      utterance.volume = volume; // 0 ~ 1
      utterance.lang = 'en-US';  // 한국어 설정
      
      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  };

  // 음성 안내 함수
  const announceStatus = (message: string, force = false) => {
    // 음성이 비활성화되어 있고 강제 안내가 아니면 무시
    if (!voiceEnabled && !force) return;
    
    // 같은 메시지 반복 방지 (3초 내에)
    if (message === lastAnnouncement) return;
    
    // 이전 타이머 취소
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    
    // 메시지 발화
    speakText(message);
    setLastAnnouncement(message);
    
    // 3초 후 마지막 안내 메시지 초기화
    announcementTimeoutRef.current = setTimeout(() => {
      setLastAnnouncement("");
    }, 3000);
  };

  // 비행 상태 음성 안내
  useEffect(() => {
    if (!voiceEnabled) return;
    
    // 스톨 상태 안내
    if (isStalling) {
      announceStatus("warning, stall condition. reduce angle of attack.");
    }
    
    // 고도 변화 안내
    const liftWeightDiff = forces.lift - forces.weight;
    if (liftWeightDiff > 10000) {
      announceStatus("ascending.");
    } else if (liftWeightDiff < -10000) {
      announceStatus("descending.");
    }
    
    // 속도 안내
    if (parameters.airspeed < 150) {
      announceStatus("speed is too low.");
    } else if (parameters.airspeed > 400) {
      announceStatus("speed is too high.");
    }
    
    // 튜토리얼 단계 완료 안내
    if (tutorialActive && completedSteps.length > 0 && 
        completedSteps.length > previousCompletedStepsRef.current.length) {
      announceStatus("step completed. good job.");
    }
    
    // 현재 완료 단계 저장
    previousCompletedStepsRef.current = completedSteps;
  }, [isStalling, parameters.airspeed, forces.lift, forces.weight, completedSteps, voiceEnabled, tutorialActive]);

  const resetSimulation = () => {
    setIsRunning(false)
    setPosition({ x: 400, y: 300, rotation: 0 })
    setVelocity({ x: 0, y: 0, angular: 0 })
  }

  const updateParameter = (key: keyof FlightParameters, value: number) => {
    setParameters((prev) => ({ ...prev, [key]: value }))
  }

  // 항공기 선택 시 열기구 특별 처리
  const selectAircraft = (aircraftId: string) => {
    setSelectedAircraft(aircraftId);
    const preset = aircraftPresets[aircraftId as keyof typeof aircraftPresets]
    if (preset) {
      updateParameter("weight", preset.weight);
      updateParameter("wingArea", preset.wingArea);
      
      // 열기구인 경우 특별 파라미터 설정
      if (aircraftId === "hot-air-balloon") {
        updateParameter("airspeed", 30); // 열기구는 속도가 매우 낮음
        updateParameter("angleOfAttack", 0); // 공격각 없음
        updateParameter("throttle", 50); // 열기구의 경우 추력 대신 열량을 의미
      }
      
      setSelectedModel(preset.modelPath);
    }
  }

  const startTutorial = () => {
    setTutorialActive(true)
    setCurrentTutorial(0)
    setCompletedSteps([])
    resetSimulation()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 시뮬레이션 캔버스 */}
      <div className="lg:col-span-2 space-y-4">
        {/* 튜토리얼 진행 및 가이드 */}
        {tutorialActive && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-sans">
                    Step {currentTutorial + 1}: {tutorialSteps[currentTutorial]?.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {tutorialSteps[currentTutorial]?.isInformational ? (
                    <Badge variant="outline" className="font-serif">
                      Analysis Mode
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-serif">
                      {completedSteps.length}/{tutorialSteps.length - 1} Complete
                    </Badge>
                  )}
                </div>
              </div>
              {!tutorialSteps[currentTutorial]?.isInformational && (
                <Progress value={(completedSteps.length / (tutorialSteps.length - 1)) * 100} className="h-2" />
              )}
            </CardHeader>
            <CardContent>
              <p className="font-serif text-muted-foreground mb-3">{tutorialSteps[currentTutorial]?.description}</p>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-serif text-muted-foreground">
                    {tutorialSteps[currentTutorial]?.explanation}
                  </p>
                </div>
              </div>

              {tutorialSteps[currentTutorial]?.isInformational && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-sans font-semibold text-blue-900 mb-2">Real-time Force Analysis:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-serif text-blue-700">Thrust vs Drag:</span>
                      <div
                        className={`font-sans font-bold ${Math.abs(forces.thrust - forces.drag) < 5000 ? "text-green-600" : "text-orange-600"}`}
                      >
                        {forces.thrust > forces.drag ? "+" : ""}
                        {Math.round(forces.thrust - forces.drag)}N
                      </div>
                    </div>
                    <div>
                      <span className="font-serif text-blue-700">Lift vs Weight:</span>
                      <div
                        className={`font-sans font-bold ${Math.abs(forces.lift - forces.weight) < 10000 ? "text-green-600" : "text-orange-600"}`}
                      >
                        {forces.lift > forces.weight ? "+" : ""}
                        {Math.round(forces.lift - forces.weight)}N
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-serif text-blue-600">
                    {Math.abs(forces.thrust - forces.drag) < 5000 && Math.abs(forces.lift - forces.weight) < 10000
                      ? "✅ Perfect balance achieved! This is steady, efficient flight."
                      : "⚖️ Adjust throttle and other parameters to achieve force balance."}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTutorial(Math.max(0, currentTutorial - 1))}
                  disabled={currentTutorial === 0}
                  className="font-serif"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentTutorial < tutorialSteps.length - 1) {
                      setCurrentTutorial(currentTutorial + 1)
                    } else {
                      setTutorialActive(false)
                    }
                  }}
                  className="font-serif"
                >
                  {currentTutorial === tutorialSteps.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced parameter feedback with tips */}
        {parameterFeedback && showHints && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-serif">{parameterFeedback}</AlertDescription>
              </Alert>
              {currentTips.length > 0 && (
                <div className="mt-3 space-y-1">
                  {currentTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-serif text-yellow-800">{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-sans">Flight Simulation</CardTitle>
                <CardDescription className="font-serif">
                  Real-time physics visualization with educational guidance
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isStalling && (
                  <Badge variant="destructive" className="font-serif">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    STALL
                  </Badge>
                )}
                <Button
                  variant={isRunning ? "secondary" : "default"}
                  size="sm"
                  onClick={() => setIsRunning(!isRunning)}
                  className="font-serif"
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={resetSimulation} className="font-serif bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 3D 렌더링 */}
            <div className="w-full h-[600px] border border-border rounded-lg bg-gradient-to-b from-blue-100 to-blue-50 relative">
              <Canvas 
                camera={{ 
                  position: [5, 2, 10], // 카메라 위치 조정
                  fov: 50, // 시야각 조정
                  near: 0.1,
                  far: 1000
                }}
                shadows
              >
                {/* 조명 설정 */}
                <ambientLight intensity={0.5} />
                <directionalLight 
                  position={[10, 10, 10]} 
                  intensity={1} 
                  castShadow 
                  shadow-mapSize-width={1024} 
                  shadow-mapSize-height={1024}
                />
                <spotLight position={[-10, 10, 10]} angle={0.3} intensity={0.5} />
                
                {/* 항공기 모델 */}
                <AircraftModel 
                  modelPath={selectedModel} 
                  position={[0, 0, 0]} // 중앙에 위치
                  rotation={[0, position.rotation, 0]}
                  angleOfAttack={parameters.angleOfAttack}
                  throttle={parameters.throttle}
                  isStalling={isStalling}
                />
                
                {/* 구름 효과 (고도에 따라 변화) */}
                {parameters.altitude < 5000 && (
                  <Cloud 
                    position={[0, -3, 0]} 
                    opacity={0.5} 
                    speed={0.4} 
                    segments={10} // width 대신 segments 사용
                  />
                )}
                
                {/* 지면 효과 제거 */}
                {/* <mesh 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  position={[0, -5, 0]} 
                  receiveShadow
                >
                  <planeGeometry args={[100, 100]} />
                  <meshStandardMaterial 
                    color="#8B7355" 
                    roughness={0.8}
                    metalness={0.2}
                  />
                </mesh> */}
                
                {/* 카메라 컨트롤 */}
                <OrbitControls 
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  minDistance={1} // 더 가깝게 확대 가능
                  maxDistance={30} // 더 멀리 축소 가능
                  zoomSpeed={1.5} // 줌 속도 증가
                  rotateSpeed={1.0} // 회전 속도
                  panSpeed={1.0} // 이동 속도
                />
                
                {/* 하늘 환경 부분 제거 또는 수정 */}
                {/* <Environment preset="sunset" background={false} /> */}

                {/* 대신 단순한 배경색 사용 */}
                <color attach="background" args={['#87CEEB']} /> {/* 하늘색 배경 */}
                
                {/* 물리 효과 시각화 */}
                <group>
                  {/* 항공기 주변 공기 흐름 시각화 */}
                  {!isStalling && parameters.airspeed > 150 && (
                    <Particles count={100} size={0.05} color="#87CEEB" speed={parameters.airspeed / 1000} />
                  )}
                  
                  {/* Stall 상태일 때 난류 시각화 */}
                  {isStalling && (
                    <Particles count={200} size={0.08} color="#FF4500" turbulence={5} speed={0.2} />
                  )}
                </group>
              </Canvas>
              
              {/* 컨트롤 도움말 */}
              <div className="absolute bottom-2 left-2 bg-black/30 text-white p-2 rounded text-xs">
                <p>mouse wheel: zoom in/out</p>
                <p>mouse drag: rotate</p>
                <p>mouse right click drag: move</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 컨트롤 */}
      <div className="space-y-6">
        {/* 항공기 선택 UI 확장 */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Select Aircraft</CardTitle>
            <CardDescription className="font-serif">
              Select different aircraft models for simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(aircraftPresets).map(([id, preset]) => (
                <button
                  key={id}
                  onClick={() => selectAircraft(id)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedAircraft === id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-muted border-border"
                  }`}
                >
                  <div className="font-medium font-sans text-sm">{preset.name}</div>
                </button>
              ))}
            </div>
            <Select value={selectedAircraft} onValueChange={selectAircraft}>
              <SelectTrigger className="font-serif">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(aircraftPresets).map(([id, preset]) => (
                  <SelectItem key={id} value={id} className="font-serif">
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* 나머지 컨트롤 UI */}
        {/* Learning controls */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Learning Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={startTutorial}
              className="w-full font-serif"
              variant={tutorialActive ? "secondary" : "default"}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {tutorialActive ? "Tutorial Active" : "Start Guided Tutorial"}
            </Button>
            
            {/* 음성 안내 토글 버튼 추가 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif">Voice Guidance</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                className={`font-serif ${voiceEnabled ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {voiceEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif">Show Hints</span>
              <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)} className="font-serif">
                {showHints ? "Hide" : "Show"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif">Advanced Metrics</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className="font-serif"
              >
                {showAdvancedMetrics ? "Hide" : "Show"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flight Parameters with enhanced descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Flight Parameters</CardTitle>
            <CardDescription className="font-serif">
              Adjust these values to see how they affect flight physics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">Airspeed: {parameters.airspeed} km/h</label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "airspeed" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.airspeed]}
                onValueChange={([value]) => updateParameter("airspeed", value)}
                min={50}
                max={500}
                step={10}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Higher speed = more lift, but also more drag (v² relationship)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">
                  Angle of Attack: {parameters.angleOfAttack}°
                  {parameters.angleOfAttack > 15 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      STALL
                    </Badge>
                  )}
                </label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "angleOfAttack" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.angleOfAttack]}
                onValueChange={([value]) => updateParameter("angleOfAttack", value)}
                min={-10}
                max={25}
                step={0.5}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Optimal range: 2-12°. Beyond 15° causes stall in most aircraft
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">Altitude: {parameters.altitude} m</label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "altitude" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.altitude]}
                onValueChange={([value]) => updateParameter("altitude", value)}
                min={0}
                max={12000}
                step={100}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Higher altitude = thinner air = less lift at same speed
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">Throttle: {parameters.throttle}%</label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "throttle" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.throttle]}
                onValueChange={([value]) => updateParameter("throttle", value)}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Controls thrust. Must balance with drag for steady flight
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Force Display */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Force Analysis</CardTitle>
            <CardDescription className="font-serif">Understanding the four forces of flight</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-serif text-green-700">Lift ↑</div>
                <div className="text-lg font-bold font-sans text-green-800">
                  {Math.round(forces.lift).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-green-600 mt-1">
                  {forces.lift > forces.weight ? "Climbing" : forces.lift < forces.weight ? "Descending" : "Level"}
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm font-serif text-red-700">Drag ←</div>
                <div className="text-lg font-bold font-sans text-red-800">
                  {Math.round(forces.drag).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-red-600 mt-1">Opposes motion</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-serif text-blue-700">Thrust →</div>
                <div className="text-lg font-bold font-sans text-blue-800">
                  {Math.round(forces.thrust).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-blue-600 mt-1">
                  {forces.thrust > forces.drag
                    ? "Accelerating"
                    : forces.thrust < forces.drag
                      ? "Decelerating"
                      : "Steady"}
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm font-serif text-orange-700">Weight ↓</div>
                <div className="text-lg font-bold font-sans text-orange-800">
                  {Math.round(forces.weight).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-orange-600 mt-1">Always downward</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-sm font-serif text-muted-foreground mb-2">Net Forces & Flight State:</div>
              <div className="space-y-1">
                <div className="text-sm font-serif flex justify-between">
                  <span>Vertical:</span>
                  <span
                    className={
                      forces.lift > forces.weight
                        ? "text-green-600"
                        : forces.lift < forces.weight
                          ? "text-red-600"
                          : "text-gray-600"
                    }
                  >
                    {Math.round(forces.lift - forces.weight).toLocaleString()}N
                  </span>
                </div>
                <div className="text-sm font-serif flex justify-between">
                  <span>Horizontal:</span>
                  <span
                    className={
                      forces.thrust > forces.drag
                        ? "text-blue-600"
                        : forces.thrust < forces.drag
                          ? "text-red-600"
                          : "text-gray-600"
                    }
                  >
                    {Math.round(forces.thrust - forces.drag).toLocaleString()}N
                  </span>
                </div>
              </div>
            </div>

            {showAdvancedMetrics && (
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-serif font-semibold mb-3">Advanced Flight Metrics:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-serif">
                    <span>Lift-to-Drag Ratio:</span>
                    <span className="font-sans font-bold">
                      {forces.drag > 0 ? (forces.lift / forces.drag).toFixed(2) : "∞"}
                    </span>
                  </div>
                  <div className="flex justify-between font-serif">
                    <span>Power Loading:</span>
                    <span className="font-sans font-bold">
                      {(parameters.weight / ((forces.thrust * parameters.airspeed) / 3.6)).toFixed(3)} kg/W
                    </span>
                  </div>
                  <div className="flex justify-between font-serif">
                    <span>Wing Loading:</span>
                    <span className="font-sans font-bold">
                      {(parameters.weight / parameters.wingArea).toFixed(1)} kg/m²
                    </span>
                  </div>
                  <div className="flex justify-between font-serif">
                    <span>Air Density:</span>
                    <span className="font-sans font-bold">
                      {(1.225 * Math.exp(-parameters.altitude / 8400)).toFixed(3)} kg/m³
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 입자 효과 컴포넌트 (공기 흐름 시각화)
function Particles({ count, size, color, speed, turbulence = 0 }: ParticlesProps) {
  const mesh = useRef<THREE.Group | null>(null);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 2;
      temp.push({ x, y, z });
    }
    return temp;
  }, [count]);
  
  useFrame(() => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      if (!mesh.current?.children[i]) return;
      
      const particleMesh = mesh.current.children[i] as THREE.Mesh;
      // 입자 움직임 업데이트
      particleMesh.position.x -= speed + (Math.random() * turbulence * 0.1);
      if (particleMesh.position.x < -2) particleMesh.position.x = 2;
    });
  });
  
  return (
    <group ref={mesh}>
      {particles.map((particle, i) => (
        <mesh key={i} position={[particle.x, particle.y, particle.z]}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}
