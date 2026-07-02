import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const leadsFilePath = path.join(process.cwd(), "src/data/leads.json");

// Ensure directory and file exist
function ensureLeadsFile() {
  const dir = path.dirname(leadsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(leadsFilePath)) {
    fs.writeFileSync(leadsFilePath, JSON.stringify([], null, 2));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, city, query, tool } = body;

    if (!name || !phone || !email || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    ensureLeadsFile();

    const data = fs.readFileSync(leadsFilePath, "utf8");
    const leads = JSON.parse(data);

    const newLead = {
      id: `lead_${Date.now()}`,
      name,
      phone,
      email,
      city,
      query: query || "",
      tool: tool || "general",
      createdAt: new Date().toISOString()
    };

    leads.push(newLead);
    fs.writeFileSync(leadsFilePath, JSON.stringify(leads, null, 2));

    return NextResponse.json({ success: true, leadId: newLead.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save lead submission" }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureLeadsFile();
    const data = fs.readFileSync(leadsFilePath, "utf8");
    const leads = JSON.parse(data);
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read leads" }, { status: 500 });
  }
}
