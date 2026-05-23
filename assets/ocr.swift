import Cocoa
import Vision

func main() -> Int32 {
    let args = CommandLine.arguments

    guard args.count == 3 else {
        fputs("Usage: ocr <image-path> <language-mode>\n", stderr)
        return 2
    }

    let imagePath = args[1]
    let languageMode = args[2]

    // Load the image
    guard let image = NSImage(contentsOfFile: imagePath) else {
        fputs("Error: Could not load image at path: \(imagePath)\n", stderr)
        return 2
    }

    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fputs("Error: Could not convert NSImage to CGImage\n", stderr)
        return 2
    }

    // Create the request
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    // Configure language settings
    switch languageMode {
    case "auto":
        request.automaticallyDetectsLanguage = true
        request.recognitionLanguages = ["tr-TR", "en-US"]
    case "tr-TR":
        request.automaticallyDetectsLanguage = false
        request.recognitionLanguages = ["tr-TR"]
    case "en-US":
        request.automaticallyDetectsLanguage = false
        request.recognitionLanguages = ["en-US"]
    default:
        fputs("Error: Unknown language mode '\(languageMode)'. Use auto, tr-TR, or en-US.\n", stderr)
        return 2
    }

    // Run the request
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

    do {
        try handler.perform([request])
    } catch {
        fputs("Error: Vision request failed: \(error.localizedDescription)\n", stderr)
        return 2
    }

    // Collect results
    guard let results = request.results, !results.isEmpty else {
        // No text found
        return 1
    }

    // Output recognized text
    let lines: [String] = results.compactMap { result in
        return result.topCandidates(1).first?.string
    }

    let output = lines.joined(separator: "\n")
    print(output)

    return 0
}

exit(main())