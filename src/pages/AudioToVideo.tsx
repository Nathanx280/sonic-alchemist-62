import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Video, Image, Palette, Sparkles, Download, Play, Pause, Square,
  SkipBack, Upload, Layers, Wand2, Grid3X3, Music2, ImagePlus, X, Circle, Waves
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUploader from "@/components/FileUploader";
import AudioVisualizer from "@/components/AudioVisualizer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { VideoExporter, drawVisualizerFrame } from "@/lib/videoExporter";

interface TextOverlay {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  position: "top" | "center" | "bottom";
  alignment: "left" | "center" | "right";
  shadowColor: string;
  shadowBlur: number;
  visible: boolean;
}

interface VisualizerSettings {
  backgroundPreset: string;
  customBackground: string | null;
  customBackgroundImage: HTMLImageElement | null;
  comicCenterImage: string | null;
  comicCenterImageElement: HTMLImageElement | null;
  comicImageAnimation: "spin" | "scroll";
  particleIntensity: number;
  glowIntensity: number;
  barStyle: "classic" | "rounded" | "dots" | "blocks" | "circular" | "radial" | "wave" | "comic";
  colorScheme: "neon" | "sunset" | "ocean" | "fire" | "purple" | "anime" | "vhs" | "vaporwave" | "custom";
  showTitle: boolean;
  showParticles: boolean;
  showRings: boolean;
  mirrorBars: boolean;
  rotatingDisc: boolean;
  titleOverlay: TextOverlay;
  artistOverlay: TextOverlay;
}

const backgroundPresets = [
  { id: "dark-gradient", name: "Dark Gradient", preview: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)" },
  { id: "purple-haze", name: "Purple Haze", preview: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #4a1a6b 100%)" },
  { id: "cyber-city", name: "Cyber City", preview: "linear-gradient(180deg, #0f0f23 0%, #1a1a3e 30%, #0a1628 100%)" },
  { id: "sunset-vibes", name: "Sunset Vibes", preview: "linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #3d1f1f 100%)" },
  { id: "ocean-deep", name: "Ocean Deep", preview: "linear-gradient(180deg, #0a1a2e 0%, #0f2a4a 50%, #0a1f35 100%)" },
  { id: "neon-nights", name: "Neon Nights", preview: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)" },
  { id: "forest-dark", name: "Forest Dark", preview: "linear-gradient(135deg, #0a1a0a 0%, #1a2e1a 50%, #0a1f0a 100%)" },
  { id: "fire-storm", name: "Fire Storm", preview: "linear-gradient(135deg, #1a0a0a 0%, #2e1a0a 50%, #3d2a0f 100%)" },
  { id: "anime-sky", name: "Anime Sky", preview: "linear-gradient(180deg, #1a0a2e 0%, #3d1a4a 40%, #ff6b9d 100%)" },
  { id: "vhs-static", name: "VHS Static", preview: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)" },
  { id: "vaporwave-grid", name: "Vaporwave Grid", preview: "linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 50%, #0f0a1a 100%)" },
];

const visualTemplates = [
  { id: "trapcity", name: "TrapCity Style", description: "Classic trap music visualizer with center disc and spectrum bars", icon: Music2 },
  { id: "monstercat", name: "Monstercat Style", description: "Circular waveform with logo center and particle effects", icon: Sparkles },
  { id: "ncs", name: "NCS Style", description: "Clean bars with glowing edges and minimal design", icon: Grid3X3 },
  { id: "bass-nation", name: "Bass Nation", description: "Heavy bass reactive with pulsing backgrounds", icon: Layers },
  { id: "chillhop", name: "Chillhop Vibes", description: "Lo-fi aesthetic with warm colors and soft glow", icon: Palette },
  { id: "edm-festival", name: "EDM Festival", description: "High energy with strobing effects and multiple layers", icon: Wand2 },
  { id: "comic-panel", name: "Comic Panel", description: "Scrolling comic book background in center, no audio bars, particles only", icon: Layers },
  { id: "anime-style", name: "Anime Style", description: "Japanese anime aesthetic with vibrant colors and dynamic effects", icon: Sparkles },
  { id: "retro-vhs", name: "Retro VHS", description: "80s VHS tape aesthetic with scan lines and chromatic aberration", icon: Grid3X3 },
  { id: "vaporwave", name: "Vaporwave", description: "Pastel pink/purple aesthetics with 80s retro-futurism vibes", icon: Palette },
];

const colorSchemes = [
  { id: "neon", name: "Neon", colors: ["hsl(185, 100%, 50%)", "hsl(270, 100%, 65%)", "hsl(320, 100%, 60%)"] },
  { id: "sunset", name: "Sunset", colors: ["hsl(30, 100%, 50%)", "hsl(350, 100%, 60%)", "hsl(280, 80%, 55%)"] },
  { id: "ocean", name: "Ocean", colors: ["hsl(200, 100%, 50%)", "hsl(180, 100%, 45%)", "hsl(220, 100%, 60%)"] },
  { id: "fire", name: "Fire", colors: ["hsl(15, 100%, 50%)", "hsl(40, 100%, 55%)", "hsl(0, 100%, 45%)"] },
  { id: "purple", name: "Purple Rain", colors: ["hsl(280, 100%, 60%)", "hsl(300, 80%, 55%)", "hsl(260, 100%, 50%)"] },
  { id: "anime", name: "Anime", colors: ["hsl(350, 100%, 65%)", "hsl(45, 100%, 60%)", "hsl(200, 100%, 70%)"] },
  { id: "vhs", name: "VHS Retro", colors: ["hsl(0, 80%, 60%)", "hsl(180, 80%, 50%)", "hsl(60, 90%, 55%)"] },
  { id: "vaporwave", name: "Vaporwave", colors: ["hsl(300, 70%, 65%)", "hsl(180, 60%, 70%)", "hsl(330, 60%, 75%)"] },
  { id: "custom", name: "Custom", colors: ["hsl(185, 100%, 50%)", "hsl(45, 100%, 60%)", "hsl(320, 100%, 60%)"] },
];

const barStyles = [
  { id: "classic", name: "Classic", icon: Grid3X3 },
  { id: "rounded", name: "Rounded", icon: Grid3X3 },
  { id: "dots", name: "Dots", icon: Circle },
  { id: "blocks", name: "Blocks", icon: Grid3X3 },
  { id: "circular", name: "Circular", icon: Circle },
  { id: "radial", name: "Radial", icon: Sparkles },
  { id: "wave", name: "Wave", icon: Waves },
  { id: "comic", name: "Comic", icon: Layers },
];

const fontOptions = [
  { id: "Orbitron", name: "Orbitron" },
  { id: "Inter", name: "Inter" },
  { id: "Arial", name: "Arial" },
  { id: "Georgia", name: "Georgia" },
  { id: "Verdana", name: "Verdana" },
  { id: "Impact", name: "Impact" },
  { id: "Courier New", name: "Courier" },
];

const textPositions = [
  { id: "top", name: "Top" },
  { id: "center", name: "Center" },
  { id: "bottom", name: "Bottom" },
];

const textAlignments = [
  { id: "left", name: "Left" },
  { id: "center", name: "Center" },
  { id: "right", name: "Right" },
];

const defaultSettings: VisualizerSettings = {
  backgroundPreset: "dark-gradient",
  customBackground: null,
  customBackgroundImage: null,
  comicCenterImage: null,
  comicCenterImageElement: null,
  comicImageAnimation: "scroll",
  particleIntensity: 50,
  glowIntensity: 60,
  barStyle: "classic",
  colorScheme: "neon",
  showTitle: true,
  showParticles: true,
  showRings: true,
  mirrorBars: true,
  rotatingDisc: true,
  titleOverlay: {
    text: "",
    font: "Orbitron",
    fontSize: 48,
    color: "#ffffff",
    position: "bottom",
    alignment: "center",
    shadowColor: "hsl(185, 100%, 50%)",
    shadowBlur: 20,
    visible: true,
  },
  artistOverlay: {
    text: "",
    font: "Inter",
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.6)",
    position: "bottom",
    alignment: "center",
    shadowColor: "transparent",
    shadowBlur: 0,
    visible: true,
  },
};

const AudioToVideo = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [staticWaveform, setStaticWaveform] = useState<number[]>([]);
  const [settings, setSettings] = useState<VisualizerSettings>(defaultSettings);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("trapcity");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comicImageInputRef = useRef<HTMLInputElement>(null);
  const videoExporterRef = useRef<VideoExporter | null>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    waveformData,
    isLoaded,
    loadFile,
    togglePlayPause,
    stop,
    seek,
  } = useAudioEngine();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const waveform = await loadFile(file);
      setStaticWaveform(waveform);
      toast.success("Audio loaded! Ready to visualize.");
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Failed to load audio file");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setStaticWaveform([]);
    stop();
  };

  const updateSetting = useCallback(<K extends keyof VisualizerSettings>(
    key: K,
    value: VisualizerSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCustomBackgroundUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setSettings(prev => ({
          ...prev,
          customBackground: dataUrl,
          customBackgroundImage: img,
          backgroundPreset: "custom",
        }));
        toast.success("Custom background loaded!");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const clearCustomBackground = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      customBackground: null,
      customBackgroundImage: null,
      backgroundPreset: "dark-gradient",
    }));
  }, []);

  const handleComicCenterImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setSettings(prev => ({
          ...prev,
          comicCenterImage: dataUrl,
          comicCenterImageElement: img,
        }));
        toast.success("Comic center image loaded!");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const clearComicCenterImage = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      comicCenterImage: null,
      comicCenterImageElement: null,
    }));
  }, []);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const templateSettings: Record<string, Partial<VisualizerSettings>> = {
      trapcity: {
        backgroundPreset: "dark-gradient",
        colorScheme: "neon",
        showParticles: true,
        showRings: true,
        mirrorBars: true,
        rotatingDisc: true,
        barStyle: "classic",
      },
      monstercat: {
        backgroundPreset: "purple-haze",
        colorScheme: "purple",
        showParticles: true,
        showRings: false,
        mirrorBars: false,
        rotatingDisc: true,
        barStyle: "rounded",
      },
      ncs: {
        backgroundPreset: "cyber-city",
        colorScheme: "neon",
        showParticles: false,
        showRings: false,
        mirrorBars: true,
        rotatingDisc: false,
        barStyle: "blocks",
      },
      "bass-nation": {
        backgroundPreset: "neon-nights",
        colorScheme: "purple",
        showParticles: true,
        showRings: true,
        mirrorBars: true,
        rotatingDisc: true,
        barStyle: "classic",
        glowIntensity: 80,
      },
      chillhop: {
        backgroundPreset: "sunset-vibes",
        colorScheme: "sunset",
        showParticles: false,
        showRings: true,
        mirrorBars: false,
        rotatingDisc: true,
        barStyle: "rounded",
        glowIntensity: 40,
      },
      "edm-festival": {
        backgroundPreset: "fire-storm",
        colorScheme: "fire",
        showParticles: true,
        showRings: true,
        mirrorBars: true,
        rotatingDisc: true,
        barStyle: "blocks",
        glowIntensity: 90,
        particleIntensity: 80,
      },
      "comic-panel": {
        backgroundPreset: "dark-gradient",
        colorScheme: "neon",
        showParticles: true,
        showRings: true,
        mirrorBars: false,
        rotatingDisc: false,
        barStyle: "comic",
        glowIntensity: 60,
        particleIntensity: 70,
      },
      "anime-style": {
        backgroundPreset: "anime-sky",
        colorScheme: "anime",
        showParticles: true,
        showRings: true,
        mirrorBars: true,
        rotatingDisc: true,
        barStyle: "rounded",
        glowIntensity: 85,
        particleIntensity: 75,
      },
      "retro-vhs": {
        backgroundPreset: "vhs-static",
        colorScheme: "vhs",
        showParticles: false,
        showRings: false,
        mirrorBars: true,
        rotatingDisc: false,
        barStyle: "blocks",
        glowIntensity: 40,
        particleIntensity: 20,
      },
      "vaporwave": {
        backgroundPreset: "vaporwave-grid",
        colorScheme: "vaporwave",
        showParticles: true,
        showRings: true,
        mirrorBars: false,
        rotatingDisc: true,
        barStyle: "classic",
        glowIntensity: 70,
        particleIntensity: 60,
      },
    };

    if (templateSettings[templateId]) {
      setSettings(prev => ({ ...prev, ...templateSettings[templateId] }));
      toast.success(`Applied ${visualTemplates.find(t => t.id === templateId)?.name} template`);
    }
  };

  const handleExport = async () => {
    if (!selectedFile) {
      toast.error("Please upload audio first");
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    stop();
    
    try {
      const exporter = new VideoExporter(1920, 1080);
      videoExporterRef.current = exporter;
      
      const currentColorScheme = colorSchemes.find(s => s.id === settings.colorScheme)?.colors || colorSchemes[0].colors;
      const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number }[] = [];
      
      toast.info("Rendering video... This may take a while.");
      
      const blob = await exporter.exportVideo(
        {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: duration || 60,
          audioFile: selectedFile,
        },
        (ctx, audioData, time) => {
          drawVisualizerFrame(ctx, audioData, time, {
            background: settings.customBackgroundImage,
            barStyle: settings.barStyle,
            colorScheme: currentColorScheme,
            showParticles: settings.showParticles,
            showRings: settings.showRings,
            mirrorBars: settings.mirrorBars,
            rotatingDisc: settings.rotatingDisc,
            title: settings.titleOverlay.text || selectedFile.name.replace(/\.[^/.]+$/, "").toUpperCase(),
            artist: settings.artistOverlay.text || "AUDIO VISUALIZER",
            particleIntensity: settings.particleIntensity,
            glowIntensity: settings.glowIntensity,
            titleOverlay: settings.titleOverlay,
            artistOverlay: settings.artistOverlay,
            comicCenterImage: settings.comicCenterImageElement,
            comicImageAnimation: settings.comicImageAnimation,
          }, particles);
        },
        (progress) => {
          setExportProgress(Math.floor(progress * 100));
        }
      );
      
      // Download the video
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_visualizer.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Video exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export video. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      videoExporterRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Audio to Video
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create stunning music visualizer videos with customizable backgrounds, templates, and effects
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-4"
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Audio Source
              </h3>
              <FileUploader
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClearFile}
              />
            </motion.div>

            {/* Templates */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-4"
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                Visual Templates
              </h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {visualTemplates.map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applyTemplate(template.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedTemplate === template.id
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-muted/20 hover:bg-muted/40 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <template.icon className={`w-5 h-5 ${selectedTemplate === template.id ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>

            {/* Settings Tabs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-4"
            >
              <Tabs defaultValue="background" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="background" className="text-xs">
                    <Image className="w-3 h-3 mr-1" />
                    BG
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="text-xs">
                    <Palette className="w-3 h-3 mr-1" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    FX
                  </TabsTrigger>
                  <TabsTrigger value="text" className="text-xs">
                    <span className="mr-1 font-bold">T</span>
                    Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="background" className="space-y-4">
                  {/* Custom Background Upload */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Custom Background</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomBackgroundUpload}
                      className="hidden"
                    />
                    {settings.customBackground ? (
                      <div className="relative rounded-lg overflow-hidden border border-primary/50">
                        <img 
                          src={settings.customBackground} 
                          alt="Custom background" 
                          className="w-full h-20 object-cover"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={clearCustomBackground}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-3 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <ImagePlus className="w-4 h-4" />
                        <span className="text-xs">Upload Image</span>
                      </motion.button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Background Preset</label>
                    <div className="grid grid-cols-4 gap-2">
                      {backgroundPresets.map((preset) => (
                        <motion.button
                          key={preset.id}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            updateSetting("backgroundPreset", preset.id);
                            updateSetting("customBackground", null);
                            updateSetting("customBackgroundImage", null);
                          }}
                          className={`aspect-square rounded-lg border-2 transition-all ${
                            settings.backgroundPreset === preset.id && !settings.customBackground
                              ? "border-primary shadow-lg shadow-primary/30"
                              : "border-transparent hover:border-muted"
                          }`}
                          style={{ background: preset.preview }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Color Scheme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {colorSchemes.map((scheme) => (
                        <motion.button
                          key={scheme.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateSetting("colorScheme", scheme.id as any)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            settings.colorScheme === scheme.id
                              ? "border-primary"
                              : "border-transparent hover:border-muted"
                          }`}
                        >
                          <div className="flex gap-1 mb-1">
                            {scheme.colors.map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="text-xs">{scheme.name}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="effects" className="space-y-4">
                  <div className="space-y-3">
                    {/* Bar Style Selector */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Bar Style</label>
                      <div className="grid grid-cols-4 gap-2">
                        {barStyles.map((style) => (
                          <motion.button
                            key={style.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSetting("barStyle", style.id as any)}
                            className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                              settings.barStyle === style.id
                                ? "border-primary bg-primary/10"
                                : "border-transparent bg-muted/20 hover:border-muted"
                            }`}
                          >
                            <style.icon className={`w-4 h-4 ${settings.barStyle === style.id ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-[10px]">{style.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Comic Center Image Upload - shown only for comic style */}
                    {settings.barStyle === "comic" && (
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                        <label className="text-xs text-accent font-medium mb-2 block flex items-center gap-2">
                          <ImagePlus className="w-3 h-3" />
                          Comic Center Artwork
                        </label>
                        <input
                          ref={comicImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleComicCenterImageUpload}
                          className="hidden"
                        />
                        {settings.comicCenterImage ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-12 h-12 rounded-full border-2 border-accent bg-cover bg-center"
                              style={{ backgroundImage: `url(${settings.comicCenterImage})` }}
                            />
                            <div className="flex-1">
                              <p className="text-[10px] text-muted-foreground">Custom artwork loaded</p>
                              <p className="text-[10px] text-accent">Shows in center circle</p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={clearComicCenterImage}
                              className="p-1.5 rounded-full bg-destructive/20 hover:bg-destructive/30"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => comicImageInputRef.current?.click()}
                            className="w-full py-2 px-3 rounded-lg border border-dashed border-accent/50 hover:border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-xs text-accent flex items-center justify-center gap-2"
                          >
                            <ImagePlus className="w-4 h-4" />
                            Upload artwork for center
                          </motion.button>
                        )}
                        <div className="flex gap-2 mt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateSetting("comicImageAnimation", "scroll")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                              settings.comicImageAnimation === "scroll"
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                            }`}
                          >
                            Scroll
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateSetting("comicImageAnimation", "spin")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                              settings.comicImageAnimation === "spin"
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                            }`}
                          >
                            Spin
                          </motion.button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {settings.comicImageAnimation === "scroll" 
                            ? "Image scrolls vertically with beat-reactive speed"
                            : "Image rotates with beat-reactive motion"}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Particle Intensity</span>
                        <span className="text-primary">{settings.particleIntensity}%</span>
                      </div>
                      <Slider
                        value={[settings.particleIntensity]}
                        onValueChange={([v]) => updateSetting("particleIntensity", v)}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Glow Intensity</span>
                        <span className="text-accent">{settings.glowIntensity}%</span>
                      </div>
                      <Slider
                        value={[settings.glowIntensity]}
                        onValueChange={([v]) => updateSetting("glowIntensity", v)}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                        <span className="text-xs">Particles</span>
                        <Switch
                          checked={settings.showParticles}
                          onCheckedChange={(v) => updateSetting("showParticles", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                        <span className="text-xs">Rings</span>
                        <Switch
                          checked={settings.showRings}
                          onCheckedChange={(v) => updateSetting("showRings", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                        <span className="text-xs">Mirror</span>
                        <Switch
                          checked={settings.mirrorBars}
                          onCheckedChange={(v) => updateSetting("mirrorBars", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                        <span className="text-xs">Rotate</span>
                        <Switch
                          checked={settings.rotatingDisc}
                          onCheckedChange={(v) => updateSetting("rotatingDisc", v)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <ScrollArea className="h-[280px] pr-2">
                    <div className="space-y-4">
                      {/* Title Overlay Settings */}
                      <div className="p-3 rounded-lg bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Title Text</span>
                          <Switch
                            checked={settings.titleOverlay.visible}
                            onCheckedChange={(v) => setSettings(prev => ({
                              ...prev,
                              titleOverlay: { ...prev.titleOverlay, visible: v }
                            }))}
                          />
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Track name (auto from file)"
                          value={settings.titleOverlay.text}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            titleOverlay: { ...prev.titleOverlay, text: e.target.value }
                          }))}
                          className="w-full px-2 py-1.5 text-xs rounded bg-background border border-border"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Font</label>
                            <select
                              value={settings.titleOverlay.font}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                titleOverlay: { ...prev.titleOverlay, font: e.target.value }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                            >
                              {fontOptions.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Size</label>
                            <input
                              type="number"
                              value={settings.titleOverlay.fontSize}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                titleOverlay: { ...prev.titleOverlay, fontSize: parseInt(e.target.value) || 48 }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                              min={12}
                              max={120}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Position</label>
                            <select
                              value={settings.titleOverlay.position}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                titleOverlay: { ...prev.titleOverlay, position: e.target.value as any }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                            >
                              {textPositions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Align</label>
                            <select
                              value={settings.titleOverlay.alignment}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                titleOverlay: { ...prev.titleOverlay, alignment: e.target.value as any }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                            >
                              {textAlignments.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Color</label>
                            <input
                              type="color"
                              value={settings.titleOverlay.color}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                titleOverlay: { ...prev.titleOverlay, color: e.target.value }
                              }))}
                              className="w-full h-7 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Glow</label>
                            <Slider
                              value={[settings.titleOverlay.shadowBlur]}
                              onValueChange={([v]) => setSettings(prev => ({
                                ...prev,
                                titleOverlay: { ...prev.titleOverlay, shadowBlur: v }
                              }))}
                              max={50}
                              step={1}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Artist Overlay Settings */}
                      <div className="p-3 rounded-lg bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Artist Text</span>
                          <Switch
                            checked={settings.artistOverlay.visible}
                            onCheckedChange={(v) => setSettings(prev => ({
                              ...prev,
                              artistOverlay: { ...prev.artistOverlay, visible: v }
                            }))}
                          />
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Artist name"
                          value={settings.artistOverlay.text}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            artistOverlay: { ...prev.artistOverlay, text: e.target.value }
                          }))}
                          className="w-full px-2 py-1.5 text-xs rounded bg-background border border-border"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Font</label>
                            <select
                              value={settings.artistOverlay.font}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                artistOverlay: { ...prev.artistOverlay, font: e.target.value }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                            >
                              {fontOptions.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Size</label>
                            <input
                              type="number"
                              value={settings.artistOverlay.fontSize}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                artistOverlay: { ...prev.artistOverlay, fontSize: parseInt(e.target.value) || 24 }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                              min={12}
                              max={80}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Position</label>
                            <select
                              value={settings.artistOverlay.position}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                artistOverlay: { ...prev.artistOverlay, position: e.target.value as any }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                            >
                              {textPositions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Align</label>
                            <select
                              value={settings.artistOverlay.alignment}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                artistOverlay: { ...prev.artistOverlay, alignment: e.target.value as any }
                              }))}
                              className="w-full px-2 py-1 text-xs rounded bg-background border border-border"
                            >
                              {textAlignments.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Color</label>
                          <input
                            type="color"
                            value={settings.artistOverlay.color.startsWith('rgba') ? '#ffffff' : settings.artistOverlay.color}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              artistOverlay: { ...prev.artistOverlay, color: e.target.value }
                            }))}
                            className="w-full h-7 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Center/Right - Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Visualizer Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Preview
                </h3>
                <div className="text-xs text-muted-foreground">
                  16:9 • 1920x1080
                </div>
              </div>

              <AudioVisualizer
                isPlaying={isPlaying}
                audioData={waveformData}
                title={settings.titleOverlay.text || selectedFile?.name.replace(/\.[^/.]+$/, "").toUpperCase() || "YOUR TRACK"}
                artist={settings.artistOverlay.text || "AUDIO VISUALIZER"}
                barStyle={settings.barStyle}
                showParticles={settings.showParticles}
                showRings={settings.showRings}
                mirrorBars={settings.mirrorBars}
                rotatingDisc={settings.rotatingDisc}
                customBackground={settings.customBackground}
                colorScheme={colorSchemes.find(s => s.id === settings.colorScheme)?.colors}
                titleOverlay={settings.titleOverlay}
                artistOverlay={settings.artistOverlay}
                comicCenterImage={settings.comicCenterImage}
              />
            </motion.div>

            {/* Playback Controls */}
            <AnimatePresence>
              {selectedFile && isLoaded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel p-4"
                >
                  <div className="flex items-center justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => seek(0)}
                      className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SkipBack className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlayPause}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={stop}
                      className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="mt-4 px-2">
                    <div 
                      className="relative h-2 bg-muted/30 rounded-full cursor-pointer group"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = x / rect.width;
                        seek(percent * duration);
                      }}
                    >
                      {/* Progress fill */}
                      <motion.div 
                        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      {/* Scrubber handle */}
                      <motion.div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                      />
                      {/* Waveform preview */}
                      <div className="absolute inset-0 flex items-center justify-between px-0.5 opacity-30">
                        {Array.from({ length: 50 }).map((_, i) => (
                          <div 
                            key={i}
                            className="w-0.5 bg-primary rounded-full"
                            style={{ 
                              height: `${20 + Math.sin(i * 0.5) * 60 + Math.random() * 20}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground px-2 mt-2">
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span className="text-primary font-medium">
                      {selectedFile?.name.replace(/\.[^/.]+$/, "").slice(0, 30)}
                    </span>
                    <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Export Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-4"
            >
              {isExporting && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Rendering video...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                disabled={!selectedFile || isExporting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary via-accent to-pink-500 text-primary-foreground font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
              >
                {isExporting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Video className="w-6 h-6" />
                    </motion.div>
                    Exporting Video... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Export as WebM Video
                  </>
                )}
              </motion.button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Creates a video file with your audio and visualizer
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AudioToVideo;
