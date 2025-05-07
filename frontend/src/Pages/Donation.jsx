import React from "react";
import { motion } from "framer-motion";

// Animation settings
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Donation = () => (
  <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-100 to-red-50 pt-4 pb-10">
    {/* Header Section */}
    <section className="relative z-10 py-6 px-6 md:px-20 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl md:text-6xl font-extrabold mb-2 text-[#800000]" // Maroon text
      >
        Donate to Make a Difference
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl max-w-3xl mx-auto italic text-[#a05252]" // Light maroon
      >
        Help us care for shelter dogs and keep our program running strong.
      </motion.p>
    </section>

    {/* Donation Section */}
    <main className="relative z-10 pt-8 px-6 md:px-20">
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="bg-white text-[#800000] rounded-2xl shadow-lg p-6 md:p-10 transition"
      >
        <h2 className="text-2xl font-bold mb-4">Donations</h2>
        <p className="leading-relaxed mb-6">
          Your donation directly supports the dogs of Project P-40.
          Funds provide food, veterinary care, enrichment supplies, and resources that
          keep the Walk-A-Week program running strong. Every dollar counts in creating brighter futures
          for shelter dogs waiting for a home.
        </p>
        <div className="bg-[#800000] rounded-xl shadow-md inline-block">
          <a
            href="https://www.clover.com/pay-widgets/d682cd3a-15d8-4ba1-8bfb-b0d73eeb867b"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-white font-semibold py-3 px-8 rounded-xl hover:bg-[#9a1c1c] transition duration-300"
          >
            Donate Now
          </a>
        </div>
      </motion.section>
    </main>
  </div>
);

export default Donation;
