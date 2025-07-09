import { NextResponse } from "next/server"

export async function GET() {
  try {
    const csvContent = `nameEn,nameFr,descriptionEn,descriptionFr,parentId,sortOrder,isActive
"Beverages","Boissons","All types of drinks","Tous types de boissons","",1,true
"Food","Nourriture","Food items","Articles alimentaires","",2,true
"Alcoholic Drinks","Boissons Alcoolisées","Alcoholic beverages","Boissons alcoolisées","BEVERAGES_ID_HERE",1,true
"Soft Drinks","Boissons Gazeuses","Non-alcoholic drinks","Boissons non alcoolisées","BEVERAGES_ID_HERE",2,true
"Main Course","Plat Principal","Main course dishes","Plats principaux","FOOD_ID_HERE",1,true
"Appetizers","Entrées","Starter dishes","Plats d'entrée","FOOD_ID_HERE",2,true`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=categories_template.csv",
      },
    })
  } catch (error) {
    console.error("Error generating categories template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
