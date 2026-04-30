import { useState } from 'react'

export function ImageViewer({ images, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const openImage = (url, index) => {
    setSelectedImage(url)
    setCurrentIndex(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % images.length
    setSelectedImage(images[nextIndex])
    setCurrentIndex(nextIndex)
  }

  const prevImage = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length
    setSelectedImage(images[prevIndex])
    setCurrentIndex(prevIndex)
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap mt-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img
              src={img}
              alt={`Evidencia ${idx + 1}`}
              className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border-2 border-[#e8dcca] hover:border-[#6b4c3a]"
              onClick={() => openImage(img, idx)}
            />
            <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs rounded px-1">
              {idx + 1}/{images.length}
            </span>
          </div>
        ))}
      </div>

      {/* Modal para ver imagen ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition z-10"
            onClick={closeModal}
          >
            ✕
          </button>
          
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#d4c4a8] text-3xl bg-[#4a3222] bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-100 transition z-10 hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
              >
                ◀
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#d4c4a8] text-3xl bg-[#4a3222] bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-100 transition z-10 hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
              >
                ▶
              </button>
            </>
          )}
          
          <img
            src={selectedImage}
            alt="Ampliada"
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-[#d4c4a8] text-sm bg-[#4a3222] bg-opacity-80 py-2 rounded-full mx-auto w-auto px-4">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}