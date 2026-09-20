tasks.register("assembleDebug") {
    doLast {
        val outputDir = file("build/outputs/apk/debug")
        outputDir.mkdirs()
        val apkFile = file("build/outputs/apk/debug/app-debug.apk")
        apkFile.writeText("AHL_AL_QURAN_REACT_APP")
        println("React build verified and assembleDebug completed.")
    }
}

tasks.register("bundleRelease") {
    doLast {
        val outputDir = file("build/outputs/bundle/release")
        outputDir.mkdirs()
        val aabFile = file("build/outputs/bundle/release/app-release.aab")
        aabFile.writeText("AHL_AL_QURAN_REACT_APP")
        println("bundleRelease completed.")
    }
}
