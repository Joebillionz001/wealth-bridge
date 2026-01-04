export const PAYSTACK_PUBLIC_KEY = "pk_live_fbf001f175602c4223a1a576070b9c422eb874e1";

export const INVESTMENT_PLANS = [
    {
        name: "Real Estate Starter",
        category: "Real Estate",
        description: "Entry-level real estate investment portfolio focusing on residential properties.",
        min: 100,
        max: 5000,
        roi: 5,
        duration: 4, // weeks
        riskLevel: "Low",
        features: ["Backed by physical assets", "Monthly dividends", "Capital appreciation"],
        benefits: "Stable returns secured by tangible property assets."
    },
    {
        name: "Tech Growth Fund",
        category: "Technology",
        description: "Invest in high-growth technology startups and established tech giants.",
        min: 500,
        max: 20000,
        roi: 8,
        duration: 6,
        riskLevel: "Medium",
        features: ["High growth potential", "Diversified tech sector", "Quarterly reports"],
        benefits: "Capitalize on the booming tech industry with managed risk."
    },
    {
        name: "Crypto Yield Plus",
        category: "Cryptocurrency",
        description: "Managed cryptocurrency trading and staking strategies.",
        min: 200,
        max: 10000,
        roi: 12,
        duration: 4,
        riskLevel: "High",
        features: ["24/7 Trading", "Staking rewards", "High liquidity"],
        benefits: "Maximize returns through expert crypto market navigation."
    },
    {
        name: "Gemini AI Fund",
        category: "Gemini Fund",
        description: "AI-driven investment strategies optimizing for market volatility.",
        min: 1000,
        max: 50000,
        roi: 15,
        duration: 8,
        riskLevel: "High",
        features: ["Algorithmic trading", "Real-time adjustments", "Performance analytics"],
        benefits: "Leverage cutting-edge AI to outperform traditional markets."
    },
    {
        name: "Green Energy Bond",
        category: "Sustainable",
        description: "Invest in renewable energy projects like solar and wind farms.",
        min: 300,
        max: 15000,
        roi: 6,
        duration: 12,
        riskLevel: "Low",
        features: ["Eco-friendly", "Government backed incentives", "Long-term stability"],
        benefits: "Earn profits while contributing to a sustainable future."
    }
];