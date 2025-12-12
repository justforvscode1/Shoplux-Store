import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

// ... imports

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files");
        const productName = formData.get("productName") || "product";

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const uploadedUrls = [];

        for (const file of files) {
            if (!file || typeof file === "string") continue;

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload via stream
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "products",
                        public_id: `${productName.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(buffer);
            });

            uploadedUrls.push(uploadResult.secure_url);
        }

        return NextResponse.json({
            success: true,
            urls: uploadedUrls
        });

    } catch (error) {
        console.error("Upload route error:", error); // Improved logging
        return NextResponse.json({ error: error.message || "Unknown server error" }, { status: 500 });
    }
}


