export const PAYSTACK_PUBLIC_KEY = "pk_live_fbf001f175602c4223a1a576070b9c422eb874e1";

export const INVESTMENT_PLANS = [
    // --- Real Estate ---
    {
        category: "Real Estate",
        name: "Starter Property Fund",
        description: "Secure your financial future with tangible residential assets. Perfect for conservative investors looking for steady, reliable growth.",
        min: 50,
        max: 199,
        roi: 6, // ~6% weekly
        duration: 2, // 2 weeks (14 days)
        riskLevel: "Low",
        features: ["Backed by physical assets", "Inflation hedge", "Capital preservation"],
        benefits: "Provides entry-level access to the real estate market. Your funds are secured by tangible residential assets, ensuring steady growth with minimal risk."
    },
    {
        category: "Real Estate",
        name: "Growth Property Portfolio",
        description: "A balanced mix of residential and commercial properties designed to accelerate your portfolio's value.",
        min: 200,
        max: 499,
        roi: 13, // ~13% weekly
        duration: 4, // 4 weeks (30 days)
        riskLevel: "Medium",
        features: ["Mixed asset allocation", "Quarterly dividends", "High appreciation potential"],
        benefits: "Focuses on developing areas with high appreciation potential. Best for investors looking for capital gains alongside consistent rental income."
    },
    {
        category: "Real Estate",
        name: "Premium Commercial Fund",
        description: "Elite access to high-value commercial infrastructure projects with long-term lease agreements.",
        min: 500,
        max: 4999,
        roi: 22, // ~22% weekly
        duration: 8, // 8 weeks (60 days)
        riskLevel: "Medium",
        features: ["Corporate lease backing", "Priority profit sharing", "Tax-efficient structure"],
        benefits: "Invests in prime commercial real estate. Offers the highest stability and yield through long-term corporate leases and high-value asset appreciation."
    },
    // --- Technology ---
    {
        category: "Technology",
        name: "Tech Starter Fund",
        description: "Tap into the booming tech sector with a diversified basket of promising early-stage startups.",
        min: 50,
        max: 149,
        roi: 10, // ~10% weekly
        duration: 2, // 2 weeks
        riskLevel: "Medium",
        features: ["High growth potential", "Sector diversification", "Early-stage access"],
        benefits: "Supports early-stage tech startups with high growth potential. This plan diversifies your risk across multiple promising ventures in the tech sector."
    },
    {
        category: "Technology",
        name: "Innovation Growth Fund",
        description: "Maximize returns by investing in disruptive technologies like AI, Biotech, and Quantum Computing.",
        min: 150,
        max: 4999,
        roi: 18, // ~18% weekly
        duration: 4, // 4 weeks
        riskLevel: "High",
        features: ["Disruptive tech focus", "Venture capital style", "Maximum ROI potential"],
        benefits: "Targets established tech companies launching disruptive products. Offers significant returns driven by market adoption and innovation."
    },
    // --- Cryptocurrency ---
    {
        category: "Cryptocurrency",
        name: "Crypto Beginner Fund",
        description: "Enter the crypto market safely with a managed portfolio of established blue-chip coins.",
        min: 20,
        max: 99,
        roi: 8, // ~8% weekly
        duration: 2, // 2 weeks
        riskLevel: "Medium",
        features: ["Blue-chip assets (BTC, ETH)", "Cold storage security", "Automated rebalancing"],
        benefits: "A managed basket of top cryptocurrencies (Bitcoin, Ethereum). Reduces volatility while keeping you exposed to the digital asset market."
    },
    {
        category: "Cryptocurrency",
        name: "Crypto Growth Fund",
        description: "Aggressive growth strategy leveraging DeFi yields and emerging altcoins for superior returns.",
        min: 100,
        max: 49999,
        roi: 20, // ~20% weekly
        duration: 4, // 4 weeks
        riskLevel: "High",
        features: ["DeFi yield farming", "Altcoin exposure", "24/7 Active trading"],
        benefits: "Actively traded portfolio including altcoins and DeFi tokens. High risk, but designed for maximum possible returns through aggressive trading strategies."
    },
    {
        category: "Gemini Fund",
        name: "Gemini Starter Plan",
        description: "Our proprietary AI-driven trading algorithm designed to generate consistent daily profits.",
        min: 50,
        max: 199,
        roi: 10, // ~10% weekly
        duration: 2, // 2 weeks
        riskLevel: "Low",
        features: ["AI-driven execution", "Zero management fees", "Daily compounding"],
        benefits: "AI-optimized trading strategy for consistent, low-risk returns. Uses predictive algorithms to time the market effectively."
    },
    {
        category: "Gemini Fund",
        name: "Gemini Premium Plan",
        description: "Institutional-grade arbitrage strategies previously available only to hedge funds.",
        min: 200,
        max: 4999,
        roi: 22, // ~22% weekly
        duration: 4, // 4 weeks
        riskLevel: "Medium",
        features: ["High-frequency trading", "Arbitrage opportunities", "Priority support"],
        benefits: "Leverages advanced high-frequency trading and arbitrage strategies. Exclusive to high-volume investors for superior ROI."
    },
    // --- Sustainable ---
    {
        category: "Sustainable",
        name: "Green Starter Fund",
        description: "Profit with purpose. Invest in renewable energy projects that deliver returns and help the planet.",
        min: 50,
        max: 149,
        roi: 11, // ~11% weekly
        duration: 4, // 4 weeks
        riskLevel: "Low",
        features: ["ESG compliant", "Carbon credit yields", "Ethical investment"],
        benefits: "Invests in certified green bonds and renewable energy projects. Earn competitive returns while reducing carbon footprints."
    },
    {
        category: "Sustainable",
        name: "Eco Growth Fund",
        description: "Scale up your impact and income by funding large-scale sustainable agriculture and water tech.",
        min: 150,
        max: 4999,
        roi: 18, // ~18% weekly
        duration: 8, // 8 weeks
        riskLevel: "Medium",
        features: ["Global impact projects", "Government backed bonds", "Sustainable growth"],
        benefits: "Focuses on sustainable agriculture and water conservation tech. Long-term growth driven by global sustainability trends."
    }
];