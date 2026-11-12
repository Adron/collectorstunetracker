import { Anton, Courier_Prime, JetBrains_Mono, Playfair_Display, Rubik_Mono_One, Space_Grotesk, Special_Elite, Yellowtail } from "next/font/google";

// Variable names match the fallbacks in @ctt/ui/themes.css (var(--font-anton, "Anton"), …).
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const yellowtail = Yellowtail({ subsets: ["latin"], weight: "400", variable: "--font-yellowtail", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-jetbrains-mono", display: "swap" });
const specialElite = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-special-elite", display: "swap" });
const rubikMonoOne = Rubik_Mono_One({ subsets: ["latin"], weight: "400", variable: "--font-rubik-mono-one", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "900", variable: "--font-playfair-display", display: "swap" });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: "700", variable: "--font-courier-prime", display: "swap" });

export const fontVariables = [spaceGrotesk, anton, yellowtail, jetbrainsMono, specialElite, rubikMonoOne, playfair, courierPrime]
  .map((f) => f.variable)
  .join(" ");
