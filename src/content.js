// Owner-supplied content only. Nothing here is inferred; the phone number is deliberately left off the public site.
export const content = {
  name: 'Zhanghong (Keith) Lin',
  location: 'New York, NY',
  email: 'linzhanghong666@gmail.com',
  links: [
    {label: 'LinkedIn', url: 'https://www.linkedin.com/in/zhanghonglin'}
  ],
  about: {
    eyebrow: 'ABOUT ME',
    lead: 'Hi, I’m Keith.',
    hook: 'I like turning questions into data, and data into things people can actually use.',
    body: [
      'My background sits between mathematics, business, and technology. I use data to uncover patterns, understand what is happening behind the numbers, and turn those insights into better decisions.',
      'I don’t like stopping at analysis. I enjoy building dashboards, tools, and products that make data useful in the real world.'
    ],
    interests: []
  },
  major: ['B.S. Applied Mathematics & Statistics', 'B.S. Business Management'],
  majorDescription: 'Graduated December 2025.',
  resume: {
    // The Resume window embeds this page. It has to be reachable from the visitor's browser, so it is the
    // deployed site rather than a localhost URL. Verified embeddable: the response carries no X-Frame-Options
    // and no CSP frame-ancestors. If it ever becomes unreachable, the window falls back to the PDF below.
    site: 'https://keith-web-gamma.vercel.app/#resume',
    file: '/Keith-Lin-Resume.pdf'
  },
  projectsIntro: 'A collection of projects I’ve built, from data analysis to 3D design.',
  // `image` is the card thumbnail, 16:10, served from public/projects/.
  projects: [
    {
      id: 'smart-finance-analyzer',
      title: 'Smart Finance Analyzer',
      subtitle: 'Full-Stack Data Application',
      period: 'April 2026',
      stack: 'Flask, Pandas, React, Chart.js, Render, Vercel',
      url: 'https://smart-finance-analyzer.vercel.app',
      summary: 'Upload a raw transaction CSV and get back a picture of where the money went: cleaned data, nine spending categories, a dashboard, and a credit card recommendation based on how you actually spend.',
      points: [
        'Processed and cleaned financial datasets using Pandas, handling missing values and categorizing transactions to ensure data integrity',
        'Built analytical pipelines for spending summaries, category breakdowns, and trend analysis, surfacing key patterns in user spending behavior',
        'Designed RESTful APIs with Flask to serve structured analytical outputs, ensuring efficient data processing and consistent response formats',
        'Deployed production application on Render (backend) and Vercel (frontend), resolving cross-environment dependency and build issues'
      ]
    },
    {
      id: 'stock-market-performance',
      title: 'Stock Market Performance Analysis',
      subtitle: 'Risk-Adjusted Returns, 2022 to 2024',
      period: 'April 2026',
      stack: 'Python, pandas, SQLite, Power BI, Tableau',
      image: '/projects/stock-market-performance.webp',
      summary: 'Three years of daily prices for AAPL, TSLA, NVDA and MSFT measured against the S&P 500, to answer one question: did these stocks pay investors for the risk they carried? Only one of them did.',
      points: [
        'Collected and validated 3,760 rows of adjusted daily data across five tickers, then engineered daily return, cumulative return, and rolling 30-day volatility and Sharpe series',
        'Found NVDA to be the only holding that beat the benchmark on a risk-adjusted basis: Sharpe 1.13 against SPY 0.28, with +51.6% alpha',
        'Identified TSLA as the clearest case of uncompensated risk: 61.3% annualized volatility for a +1.4% return, a negative Sharpe ratio, and a -71.8% maximum drawdown',
        'Loaded the processed data into SQLite and ran six analytical queries, including the systemic stress days when all four stocks fell more than 2% together',
        'Answered the same six business questions three ways, in Excel PivotTables, a Power BI matrix with DAX measures, and a Tableau story, to compare the tools directly'
      ]
    },
    {
      id: 'flushing-eats',
      title: 'Flushing Eats',
      subtitle: 'Private Food Journal PWA',
      period: 'June to July 2026',
      stack: 'React, TypeScript, Vite, Firebase, Google Maps',
      summary: 'A food journal for one neighborhood. Sign in with Google, save restaurants with menu photos, see them on a map, filter by area, cuisine and dish, and make a list public only when you decide to.',
      points: [
        'Built a Google-authenticated PWA on Firestore where each diner keeps a private library instead of contributing to one shared public database',
        'Plotted saved restaurants on Google Maps with marker clustering, filtered by area, cuisine and dish type',
        'Scoped the product deliberately: no ratings, no reviews, no social graph, no admin backend, so the core stayed finishable',
        'Shipped in phases across 53 commits, ending with restaurant detail, edit, delete, and a per-list public toggle'
      ]
    },
    {
      id: 'studio',
      title: 'Studio',
      subtitle: 'Interactive 3D Resume',
      period: 'September 2026',
      stack: 'Three.js, Blender, Vite',
      image: '/projects/studio.webp',
      summary: 'The site you are standing in. A Blender-rendered room rebuilt as a depth mesh so the camera can move through it, with the objects on the desk wired up as the navigation.',
      points: [
        'Reconstructed a Cycles render as a 2.5D depth mesh in Three.js, keeping the rendered materials while letting the camera parallax with the pointer',
        'Made the desk itself the navigation: the speaker opens a music player, the phone wakes for contact details, and the monitor opens a full desktop',
        'Drew the monitor and phone screens as live canvas textures on the original curved geometry, so the clock and calendar follow the visitor’s own device time',
        'Kept it reachable: full keyboard paths, reduced-motion fallbacks, and 44px touch targets derived from the projected 3D silhouettes'
      ]
    }
  ],
  playlist: [
    {title: 'Level 2-3 Puff Piece', artist: '7th Beat Games', url: '/music/puff-piece-1.mp3'}
  ],
  musicUrl: null,
  musicTitle: null
};
