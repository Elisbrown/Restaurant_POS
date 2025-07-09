import { NextResponse } from "next/server"

export async function GET() {
  try {
    const csvContent = `nameEn,nameFr,descriptionEn,descriptionFr,sku,barcode,categoryId,price,costPrice,stockQuantity,minStockLevel,maxStockLevel,unit,isActive,isAvailable,tags
"Coca Cola","Coca Cola","Refreshing cola drink","Boisson rafraîchissante au cola","","","CATEGORY_ID_HERE",500,300,100,10,200,"bottle",true,true,"drink,cola,popular"
"Chicken Wings","Ailes de Poulet","Grilled chicken wings","Ailes de poulet grillées","","","CATEGORY_ID_HERE",2500,1500,50,5,100,"piece",true,true,"food,chicken,grilled"
"Red Wine","Vin Rouge","Premium red wine","Vin rouge premium","","","CATEGORY_ID_HERE",15000,8000,20,2,50,"bottle",true,true,"wine,alcohol,premium"`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products_template.csv",
      },
    })
  } catch (error) {
    console.error("Error generating products template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
