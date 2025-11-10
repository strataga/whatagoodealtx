'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const slides = [
  { id: 1, image: '/slides/slide1.jpg' },
  { id: 2, image: '/slides/slide2.jpg' },
  { id: 3, image: '/slides/slide3.jpg' },
  { id: 4, image: '/slides/slide4.jpg' },
  { id: 5, image: '/slides/slide5.jpg' },
  { id: 6, image: '/slides/slide6.jpg' },
  { id: 7, image: '/slides/slide7.jpg' },
  // { id: 8, image: '/slides/slide8.jpg' },
  { id: 9, image: '/slides/slide9.jpg' },
  { id: 10, image: '/slides/slide10.jpg' },
  { id: 11, image: '/slides/slide11.jpg' },
  { id: 12, image: '/slides/slide12.jpg' },
  { id: 13, image: '/slides/slide13.jpg' },
  { id: 14, image: '/slides/slide14.jpg' },
  { id: 15, image: '/slides/slide15.jpg' },
  { id: 16, image: '/slides/slide16.jpg' },
]

export default function Slideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Preload all images on mount
  useEffect(() => {
    slides.forEach((slide) => {
      const img = document.createElement('img')
      img.src = slide.image
    })
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, currentSlide])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const getPrevIndex = () => (currentSlide - 1 + slides.length) % slides.length
  const getNextIndex = () => (currentSlide + 1) % slides.length

  return (
    <div className="slideshow-container">
      <div className="slideshow-frame">
        <div className="slideshow-carousel">
          {/* Previous Slide */}
          <div className="carousel-slide carousel-prev">
            <Image
              src={slides[getPrevIndex()].image}
              alt={`Slide ${slides[getPrevIndex()].id}`}
              fill
              style={{ objectFit: 'cover' }}
              priority={currentSlide <= 1}
            />
          </div>

          {/* Current Slide (Center/Largest) */}
          <div className="carousel-slide carousel-current">
            <Image
              src={slides[currentSlide].image}
              alt={`Slide ${slides[currentSlide].id}`}
              fill
              style={{ objectFit: 'cover' }}
              priority={currentSlide === 0}
            />
          </div>

          {/* Next Slide */}
          <div className="carousel-slide carousel-next">
            <Image
              src={slides[getNextIndex()].image}
              alt={`Slide ${slides[getNextIndex()].id}`}
              fill
              style={{ objectFit: 'cover' }}
              priority={currentSlide === 0}
            />
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          className="slide-nav slide-prev"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          ❮
        </button>
        <button
          className="slide-nav slide-next"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          ❯
        </button>

        {/* Dots Navigation */}
        <div className="slide-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slide-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
