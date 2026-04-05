import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQSectionProps {
  onNavigateWithQuestion?: (question: string) => void;
}

const FAQData: FAQItem[] = [
  {
    id: "1",
    category: "Coverage",
    question: "What is drug coverage?",
    answer:
      "Drug coverage refers to which medications are included in your health insurance plan. Your insurance company maintains a formulary—a list of covered drugs. Some drugs require prior authorization or step therapy before approval.",
  },
  {
    id: "2",
    category: "Coverage",
    question: "How do I know if a drug is covered by my plan?",
    answer:
      "You can check your insurance plan's formulary by logging into your insurance company's website or by contacting them directly. PolicyPulse helps translate coverage policies into plain language so you understand what's covered and what conditions apply.",
  },
  {
    id: "3",
    category: "Prior Authorization",
    question: "What is prior authorization?",
    answer:
      "Prior authorization is a requirement by your insurance company to approve a medication before you can fill the prescription. Your doctor must submit documentation to prove the drug is medically necessary. This process typically takes 24-72 hours.",
  },
  {
    id: "4",
    category: "Prior Authorization",
    question: "Why is prior authorization needed?",
    answer:
      "Insurance companies require prior authorization to control costs and ensure medications are prescribed appropriately. It helps prevent unnecessary or duplicate drug usage and ensures the most cost-effective treatments are used first.",
  },
  {
    id: "5",
    category: "Step Therapy",
    question: "What is step therapy?",
    answer:
      "Step therapy (also called fail-first therapy) means your insurance company requires you to try lower-cost medications before covering more expensive ones. If the lower-cost option doesn't work for you, your doctor can request coverage for the higher-cost drug.",
  },
  {
    id: "6",
    category: "Step Therapy",
    question: "Can I appeal a step therapy requirement?",
    answer:
      "Yes. If the required medication fails to work for you, your doctor can submit a request for coverage of the desired drug with clinical evidence. Requests are typically reviewed within 72 hours. You have the right to appeal any insurance denial.",
  },
  {
    id: "7",
    category: "General",
    question: "What documents do I need for drug approval?",
    answer:
      "Most insurance companies require a prescription from your doctor and sometimes clinical documentation showing medical necessity. For step therapy appeals, you may need lab results or previous treatment records. PolicyPulse helps you understand what documents your specific payer requires.",
  },
  {
    id: "8",
    category: "General",
    question: "How does PolicyPulse help me?",
    answer:
      "PolicyPulse transforms complex drug coverage policies into plain-language summaries. Ask questions about specific drugs, payers, step therapy roadmaps, and prior authorization checklists. Upload your own policy documents for personalized guidance.",
  },
];

const categories = ["All", "Coverage", "Prior Authorization", "Step Therapy", "General"];

export function FAQSection({ onNavigateWithQuestion }: FAQSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    setExpandedId(null);
  }, [selectedCategory]);

  const filteredFAQs =
    selectedCategory === "All"
      ? FAQData
      : FAQData.filter((item) => item.category === selectedCategory);

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <section className="mb-16" id="faq">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Understanding drug coverage, prior authorization, and step therapy
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setExpandedId(null);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                backgroundColor:
                  selectedCategory === cat
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(100, 116, 139, 0.05)",
                borderColor:
                  selectedCategory === cat
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(100, 116, 139, 0.2)",
              }}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "text-blue-700"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* FAQ Items */}
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredFAQs.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              <motion.button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.03)" }}
                whileTap={{ scale: 0.998 }}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 group hover:border-blue-200 transition-colors"
              >
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-1 shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-blue-500/60 group-hover:text-blue-600 transition-colors" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <motion.p className="font-medium text-slate-900 text-left leading-tight group-hover:text-blue-700 transition-colors">
                        {item.question}
                      </motion.p>
                      <motion.span className="text-xs text-slate-500 mt-1 inline-block">
                        {item.category}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.button>

              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="bg-blue-50 rounded-xl p-4 mt-2 ml-9 border-l-4 border-blue-400 border border-blue-200"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {item.answer}
                      </p>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-blue-200 flex flex-wrap gap-2"
                      >
                        <motion.button
                          onClick={() => {
                            setExpandedId(null);
                            onNavigateWithQuestion?.(item.question);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-200 text-blue-700 font-medium hover:bg-blue-300 transition-colors cursor-pointer"
                        >
                          Ask in Care Assistant →
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12 rounded-xl p-8 text-center bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Still have questions?</h3>
          <p className="text-sm text-slate-600 mb-6">
            Ask PolicyPulse directly in the Care Assistant. Upload your policy documents for personalized answers.
          </p>
          <motion.button
            onClick={() => onNavigateWithQuestion?.("What else can you help me understand about drug coverage policies?")}
            whileHover={{ scale: 1.05, x: 4 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-[#0000FF] text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <span>Open Care Assistant</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
