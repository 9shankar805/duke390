import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let gifPath = "assets/Motorcycle_disassembles_in_studio_1080p_20260928040603-ezgif.com-video-to-gif-converter.gif"
let outputDir = "assets/frames"

let fileManager = FileManager.default
try? fileManager.createDirectory(atPath: outputDir, withIntermediateDirectories: true, attributes: nil)

let gifURL = URL(fileURLWithPath: gifPath)
guard let imageSource = CGImageSourceCreateWithURL(gifURL as CFURL, nil) else {
    print("Error: Failed to open GIF at \(gifPath)")
    exit(1)
}

let frameCount = CGImageSourceGetCount(imageSource)
print("Found \(frameCount) frames in GIF.")

for index in 0..<frameCount {
    guard let cgImage = CGImageSourceCreateImageAtIndex(imageSource, index, nil) else {
        continue
    }
    
    let frameNumber = String(format: "%04d", index + 1)
    let outputURL = URL(fileURLWithPath: "\(outputDir)/frame_\(frameNumber).jpg")
    
    guard let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        continue
    }
    
    let options: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: 0.88
    ]
    
    CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
    CGImageDestinationFinalize(destination)
}

print("Successfully extracted \(frameCount) frames to \(outputDir)")
