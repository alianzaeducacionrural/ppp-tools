export function ImageViewer({ images }) {
  if (!images || images.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Evidencia ${idx + 1}`}
          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border-2 border-gray-200 hover:border-green-500"
        />
      ))}
    </div>
  )
}