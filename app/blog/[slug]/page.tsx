import { WebGLShader } from "@/components/ui/web-gl-shader"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Image from "next/image"

const posts: Record<string, any> = {
  "welcome-to-goodquestion": {
    title: "Welcome to GoodQuestion.AI",
    date: "2024-01-15",
    author: "Steve Abrams",
    readTime: "3 min read",
    coverImage: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1600&auto=format&fit=crop",
    content: `
      <p>Welcome to GoodQuestion.AI, where we're pioneering the future of AI solutions for the hospitality and home decor industries.</p>

      <h2>Our Mission</h2>
      <p>We believe that artificial intelligence should be accessible, practical, and transformative. Our mission is to empower businesses in the hospitality and home decor sectors with cutting-edge AI tools that enhance customer experiences and streamline operations.</p>

      <h2>What We Do</h2>
      <p>At GoodQuestion.AI, we specialize in:</p>
      <ul>
        <li>Color extraction and analysis for product matching</li>
        <li>Intelligent product tagging and categorization</li>
        <li>AI-generated product descriptions that convert</li>
        <li>Visual search capabilities for enhanced user experience</li>
        <li>Custom AI solutions tailored to your business needs</li>
      </ul>

      <h2>Why Choose Us</h2>
      <p>With years of experience in AI development and a deep understanding of the hospitality and home decor industries, we're uniquely positioned to deliver solutions that make a real difference. Our tools integrate seamlessly with existing platforms like Shopify and WooCommerce, ensuring a smooth implementation process.</p>

      <h2>Get Started</h2>
      <p>Ready to transform your business with AI? Contact us today to learn more about how GoodQuestion.AI can help you stay ahead of the competition.</p>
    `
  },
  "ai-revolution-hospitality": {
    title: "The AI Revolution in Hospitality",
    date: "2024-01-10",
    author: "Steve Abrams",
    readTime: "7 min read",
    coverImage: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1600&auto=format&fit=crop",
    content: `
      <p>The hospitality industry is experiencing a transformative shift as artificial intelligence becomes increasingly integrated into daily operations and customer interactions.</p>

      <h2>Current State of AI in Hospitality</h2>
      <p>From chatbots handling customer inquiries to predictive analytics optimizing pricing strategies, AI is already making significant impacts across the hospitality sector. Hotels and restaurants are leveraging these technologies to enhance guest experiences while improving operational efficiency.</p>

      <h2>Key Applications</h2>
      <h3>Personalized Guest Experiences</h3>
      <p>AI algorithms analyze guest preferences and behavior patterns to deliver highly personalized recommendations and services. This includes customized room settings, dining suggestions, and activity recommendations based on individual preferences.</p>

      <h3>Revenue Management</h3>
      <p>Dynamic pricing models powered by AI help hotels optimize room rates based on demand, seasonality, and competitor pricing. This ensures maximum revenue while maintaining competitive rates.</p>

      <h3>Operational Efficiency</h3>
      <p>AI-powered systems streamline operations by automating routine tasks, predicting maintenance needs, and optimizing staff scheduling. This allows human staff to focus on high-value, guest-facing activities.</p>

      <h2>Future Trends</h2>
      <p>As we look ahead, several emerging trends are set to further revolutionize the hospitality industry:</p>
      <ul>
        <li>Voice-activated room controls and concierge services</li>
        <li>Predictive analytics for anticipating guest needs</li>
        <li>Computer vision for enhanced security and service</li>
        <li>Blockchain integration for secure, transparent transactions</li>
      </ul>

      <h2>Challenges and Opportunities</h2>
      <p>While AI presents enormous opportunities, the hospitality industry must also navigate challenges such as data privacy concerns, the need for staff training, and maintaining the human touch that defines hospitality. Successful implementation requires a balanced approach that enhances rather than replaces human interaction.</p>
    `
  },
  "color-psychology-home-decor": {
    title: "Color Psychology in Home Decor",
    date: "2024-01-05",
    author: "Steve Abrams",
    readTime: "5 min read",
    coverImage: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1600&auto=format&fit=crop",
    content: `
      <p>Color plays a crucial role in home decor, influencing mood, perception, and even behavior. With AI-powered color extraction and analysis, businesses can leverage color psychology to enhance customer experiences and drive sales.</p>

      <h2>The Science of Color Psychology</h2>
      <p>Colors evoke emotional responses and can significantly impact how we feel in a space. Understanding these psychological effects is essential for creating harmonious, appealing environments that resonate with customers.</p>

      <h3>Warm Colors</h3>
      <p>Reds, oranges, and yellows create energy and warmth. They're perfect for social spaces like living rooms and dining areas, stimulating conversation and appetite.</p>

      <h3>Cool Colors</h3>
      <p>Blues, greens, and purples promote calm and relaxation. These colors work well in bedrooms and bathrooms, creating peaceful retreats from daily stress.</p>

      <h3>Neutral Colors</h3>
      <p>Whites, grays, and beiges provide versatility and sophistication. They serve as excellent backgrounds, allowing other design elements to shine.</p>

      <h2>AI-Powered Color Analysis</h2>
      <p>Our advanced AI technology can:</p>
      <ul>
        <li>Extract dominant colors from product images</li>
        <li>Suggest complementary color palettes</li>
        <li>Analyze trending color combinations</li>
        <li>Predict customer preferences based on color choices</li>
      </ul>

      <h2>Implementation in E-commerce</h2>
      <p>For home decor retailers, understanding color psychology and leveraging AI color analysis can:</p>
      <ul>
        <li>Improve product recommendations</li>
        <li>Enhance visual search capabilities</li>
        <li>Create more appealing product displays</li>
        <li>Increase conversion rates through better matching</li>
      </ul>

      <h2>Case Studies</h2>
      <p>We've helped numerous clients implement color-based AI solutions with remarkable results. One furniture retailer saw a 35% increase in conversion rates after implementing our color-matching recommendation engine.</p>
    `
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug] || posts["welcome-to-goodquestion"]

  return (
    <>
      <WebGLShader />
      <article className="min-h-screen py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog">
            <LiquidButton variant="outline" size="sm" className="mb-8 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </LiquidButton>
          </Link>

          <div className="rounded-3xl overflow-hidden mb-8 aspect-video relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>

          <header className="mb-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {post.title}
              </span>
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
          </header>

          <div
            className="prose prose-lg prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              '--tw-prose-body': '#e5e7eb',
              '--tw-prose-headings': '#ffffff',
              '--tw-prose-links': '#60a5fa',
              '--tw-prose-bold': '#ffffff',
              '--tw-prose-bullets': '#9ca3af',
            } as React.CSSProperties}
          />
        </div>
      </article>
    </>
  )
}