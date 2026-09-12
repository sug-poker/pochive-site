import Nav from '../components/Nav'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import PricingSection from '../components/PricingSection'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
    </>
  )
}
