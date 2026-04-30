import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          size={20}
          weight="bold"
          className="absolute inset-0 transition-all duration-300 dark:-rotate-90 dark:opacity-0 rotate-0 opacity-100"
        />
        <Moon
          size={20}
          weight="bold"
          className="absolute inset-0 transition-all duration-300 dark:rotate-0 dark:opacity-100 rotate-90 opacity-0"
        />
      </div>
    </motion.button>
  );
}
