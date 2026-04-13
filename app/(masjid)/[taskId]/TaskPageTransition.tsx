"use client";

import { motion } from "framer-motion";

export default function TaskPageTransition({
  taskId,
  children,
}: {
  taskId: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={taskId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
