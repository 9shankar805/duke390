import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

func extract(gifPath: String, outputDir: String, prefix: String) {
    let fileManager = FileManager.default
    try? fileManager.createDirectory(atPath: outputDir, withIntermediateDirectories: true, attributes: nil)

    let gifURL = URL(fileURLWithPath: gifPath)
    guard let imageSource = CGImageSourceCreateWithURL(gifURL as CFURL, nil) else {
        print("Failed to open GIF at \(gifPath)")
        return
    }

    let frameCount = CGImageSourceGetCount(imageSource)
    print("Found \(frameCount) frames in \(gifPath)")

    for index in 0..<frameCount {
        guard let cgImage = CGImageSourceCreateImageAtIndex(imageSource, index, nil) else {
            continue
        }
        
        let frameNumber = String(format: "%04d", index + 1)
        let outputURL = URL(fileURLWithPath: "\(outputDir)/\(prefix)_\(frameNumber).jpg")
        
        guard let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
            continue
        }
        
        let options: [CFString: Any] = [
            kCGImageDestinationLossyCompressionQuality: 0.90
        ]
        
        CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
        CGImageDestinationFinalize(destination)
    }
}

extract(gifPath: "assets/ezgif.com-gif-maker.gif", outputDir: "assets/frames_maker", prefix: "maker")
