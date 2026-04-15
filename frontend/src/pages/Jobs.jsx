import React from 'react';
import { FaBriefcase } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Jobs = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12">
      {/* Big Animated Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 100,
          damping: 15,
          duration: 0.6 
        }}
        className="mb-10 p-10 rounded-3xl bg-slate-100 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none"
      >
        <FaBriefcase className="w-20 h-20 md:w-24 md:h-24" />
      </motion.div>

      {/* Heading */}
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight font-display"
      >
        Jobs Feature Coming Soon
      </motion.h1>

      {/* Subtext */}
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium"
      >
        We’re working on integrating job search for you. This will allow you to discover opportunities that match your interview performance and skills.
      </motion.p>
      
      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-16 flex flex-col items-center gap-4"
      >
        <div className="flex space-x-3">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-pulse [animation-delay:0.2s]"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-slate-500 dark:bg-slate-500 animate-pulse [animation-delay:0.4s]"></div>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          Under Construction
        </span>
      </motion.div>
    </div>
  );
};

export default Jobs;
