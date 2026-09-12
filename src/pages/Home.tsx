import Nav from '../components/Nav'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import PricingSection from '../components/PricingSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
