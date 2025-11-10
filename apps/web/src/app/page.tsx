'use client'

// import { useState, useEffect } from 'react'
import Image from 'next/image'
// import ContactModal from '@/components/ContactModal'
import Slideshow from '@/components/Slideshow'
// import type { FeaturedItem } from '@/types/instagram'

// const defaultCategories = [
//   {
//     id: '1',
//     title: 'Vintage Fashion',
//     description: 'Authentic 50s clothing & accessories from the golden era of style',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '2',
//     title: 'Retro Electronics',
//     description: 'Classic radios, record players & vintage gadgets that still work',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '3',
//     title: 'Antiques',
//     description: 'Rare collectible treasures and one-of-a-kind vintage finds',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '4',
//     title: 'Vintage Books',
//     description: 'First editions, classic literature & vintage magazines',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '5',
//     title: 'Retro Art',
//     description: 'Original 50s prints, paintings & nostalgic wall decor',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '6',
//     title: 'Kitchen Items',
//     description: 'Vintage Pyrex, glassware, utensils & retro kitchen decor',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '7',
//     title: 'Vintage Toys',
//     description: 'Classic toys and games from the 1950s',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '8',
//     title: 'Retro Furniture',
//     description: 'Mid-century modern furniture and home decor',
//     image: '/sample.jpg',
//     link: '#',
//   },
//   {
//     id: '9',
//     title: 'Collectibles',
//     description: 'Unique vintage collectibles and memorabilia',
//     image: '/sample.jpg',
//     link: '#',
//   },
// ]

const socialLinks = [
  { name: '📺 Whatnot', href: 'https://www.whatnot.com/user/whatagoodealtx' },
  { name: '📷 Instagram', href: 'https://www.instagram.com/whatagoodealtx' },
  { name: '👍 Facebook', href: 'https://www.facebook.com/profile.php?id=61583154290122#' },
  { name: '🎥 TikTok', href: 'https://www.tiktok.com/@whatagoodealtx?is_from_webapp=1&sender_device=pc' },
  { name: '📧 Email', href: 'mailto:jen@whatagoodealtx.com' },
]

export default function Home() {
  // const [isModalOpen, setIsModalOpen] = useState(false)
  // const [items, setItems] = useState<FeaturedItem[]>(defaultCategories)
  // const [loading, setLoading] = useState(true)

  // useEffect(() => {
  //   const fetchInstagramPosts = async () => {
  //     try {
  //       const response = await fetch('/api/instagram')
  //       if (response.ok) {
  //         const data = await response.json()
  //         if (data.posts && data.posts.length > 0) {
  //           setItems(data.posts)
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch Instagram posts:', error)
  //       // Keep default categories on error
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   fetchInstagramPosts()
  // }, [])

  return (
    <>
      <div className="postcard-container">
      <div className="postcard">
        <div className="postcard-front">
          <div className="postcard-header">
            <div className="logo-stamp">
              <Image
                src="/logo.png"
                alt="WhataGoodealTX Logo"
                width={400}
                height={400}
                priority
              />
            </div>
            <h1>WhataGoodealTX</h1>

            <div className="wish-you-were-here">
              <h2>Wish You Were Here!</h2>
              <div className="social-stamps">
                {socialLinks.map((link) => (
                  <a key={link.name} href={link.href} target="_blank" className="stamp">
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <Slideshow />
          </div>

          {/* <div className="postcard-sections">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="section-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card-image">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={200}
                  />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </a>
            ))}
          </div> */}

          <div className="postmark">
            <p>Delivering vintage dreams directly to you!</p>
          </div>
        </div>
      </div>
      </div>

      {/* Floating Contact Button */}
      {/*<button
        className="contact-trigger"
        onClick={() => setIsModalOpen(true)}
        aria-label="Open contact form"
      >
        ✉️
      </button>*/}

      {/* Contact Modal 
      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        */}
    </>
  )
}
