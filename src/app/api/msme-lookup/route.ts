import { NextResponse } from "next/server";

const MOCK_RECORDS: Record<string, any> = {
  "MSTEC9182F": {
    pan: "MSTEC9182F",
    udyamNumber: "UDYAM-MH-19-0128456",
    name: "Mastech Systems Private Limited",
    type: "Micro",
    activity: "Services",
    status: "Active"
  },
  "KDKSO8162G": {
    pan: "KDKSO8162G",
    udyamNumber: "UDYAM-RJ-17-0038291",
    name: "KDK Software Solutions",
    type: "Small",
    activity: "Services",
    status: "Active"
  },
  "TCSIND1029D": {
    pan: "TCSIND1029D",
    udyamNumber: "UDYAM-DL-10-0982314",
    name: "Tata Consultancy Services Ltd",
    type: "Medium",
    activity: "Services",
    status: "Active"
  },
  "RELIAN8271A": {
    pan: "RELIAN8271A",
    udyamNumber: "Not Found (Non-MSME)",
    name: "Reliance Industries Limited",
    type: "Non-MSME",
    activity: "Manufacturing",
    status: "Inactive"
  }
};

export async function POST(request: Request) {
  try {
    const { pan, mode, provider, apiKey, apiSecret } = await request.json();

    if (!pan || typeof pan !== "string" || pan.length !== 10) {
      return NextResponse.json({ success: false, error: "Invalid PAN number format" }, { status: 400 });
    }

    const cleanPan = pan.trim().toUpperCase();

    // 1. DEMO MODE
    if (mode === "demo") {
      // Return pre-programmed match if exists
      if (MOCK_RECORDS[cleanPan]) {
        return NextResponse.json({ success: true, data: MOCK_RECORDS[cleanPan], source: "demo" });
      }

      // Generate realistic mock data for demo demonstration
      const fifth = cleanPan.charAt(4);
      let entityName = "ABC Enterprise (Demo)";
      if (fifth === "C") entityName = "Global Tech Industries Ltd (Demo)";
      else if (fifth === "P") entityName = "Rajesh Kumar & Sons (Demo)";
      else if (fifth === "F") entityName = "Apex Logistics Firm (Demo)";

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const isRegistered = Math.random() > 0.3; // 70% chance of being registered in demo

      if (isRegistered) {
        return NextResponse.json({
          success: true,
          data: {
            pan: cleanPan,
            udyamNumber: `UDYAM-MH-19-0${randomSuffix}`,
            name: entityName,
            type: Math.random() > 0.4 ? "Micro" : "Small",
            activity: Math.random() > 0.5 ? "Manufacturing" : "Services",
            status: "Active"
          },
          source: "demo"
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            pan: cleanPan,
            udyamNumber: "Not Found (Non-MSME)",
            name: entityName,
            type: "Non-MSME",
            activity: "N/A",
            status: "Inactive"
          },
          source: "demo"
        });
      }
    }

    // 2. LIVE MODE
    if (mode === "live") {
      if (!apiKey) {
        return NextResponse.json({ success: false, error: "API Key is required for Live Mode" }, { status: 400 });
      }

      if (provider === "surepass") {
        try {
          // Surepass Udyam PAN Verification API
          const response = await fetch("https://api.surepass.io/api/v1/corporate/msme-search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({ id_number: cleanPan })
          });

          if (!response.ok) {
            const errBody = await response.text();
            return NextResponse.json({ success: false, error: `Surepass API Error: ${errBody}` }, { status: response.status });
          }

          const resData = await response.json();
          if (resData.success && resData.data) {
            return NextResponse.json({
              success: true,
              data: {
                pan: cleanPan,
                udyamNumber: resData.data.udyam_registration_number || "Not Found",
                name: resData.data.enterprise_name || "N/A",
                type: resData.data.enterprise_type || "Non-MSME",
                activity: resData.data.activity_type || "N/A",
                status: resData.data.status || "Inactive"
              },
              source: "surepass"
            });
          } else {
            return NextResponse.json({ success: false, error: resData.message || "Failed to find Udyam details" }, { status: 404 });
          }
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Connection failed: ${err.message}` }, { status: 500 });
        }
      }

      if (provider === "cashfree") {
        if (!apiSecret) {
          return NextResponse.json({ success: false, error: "API Secret is required for Cashfree Mode" }, { status: 400 });
        }

        try {
          const response = await fetch("https://verification.cashfree.com/v1/verification/udyam", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-client-id": apiKey,
              "x-client-secret": apiSecret
            },
            body: JSON.stringify({ pan: cleanPan })
          });

          if (!response.ok) {
            const errBody = await response.text();
            return NextResponse.json({ success: false, error: `Cashfree API Error: ${errBody}` }, { status: response.status });
          }

          const resData = await response.json();
          // Cashfree standard response mapping
          if (resData.status === "SUCCESS" && resData.udyam_details) {
            return NextResponse.json({
              success: true,
              data: {
                pan: cleanPan,
                udyamNumber: resData.udyam_details.udyam_registration_number || "Not Found",
                name: resData.udyam_details.enterprise_name || "N/A",
                type: resData.udyam_details.enterprise_type || "Non-MSME",
                activity: resData.udyam_details.activity_type || "N/A",
                status: resData.udyam_details.status || "Active"
              },
              source: "cashfree"
            });
          } else {
            return NextResponse.json({ success: false, error: resData.message || "Failed to retrieve Udyam details" }, { status: 404 });
          }
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Connection failed: ${err.message}` }, { status: 500 });
        }
      }

      return NextResponse.json({ success: false, error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Invalid mode selection" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
