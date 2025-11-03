import React from 'react'
import Hero from '../../components/student/Hero'
import Companies from '../../components/student/Companies'
import CoursesSection from '../../components/student/CoursesSection'
import TestimoniaslSection from '../../components/student/TestimoniaslSection'
import CallToAction from '../../components/student/CallToAction'
import Footer from '../../components/student/Footer'

function Home() {
  return (
    <div className='flex flex-col items-center space-y-7 text-center'>
      <Hero/>
      <Companies/>
      <CoursesSection/>
      <TestimoniaslSection/>
      <CallToAction/>
      <Footer/>
    </div>
  )
}

export default Home
