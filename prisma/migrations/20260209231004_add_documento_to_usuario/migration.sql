/*
  Warnings:

  - You are about to drop the `_ProdutoToUsuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[documento]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Made the column `estrelas` on table `Produto` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `documento` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ProdutoToUsuario" DROP CONSTRAINT "_ProdutoToUsuario_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProdutoToUsuario" DROP CONSTRAINT "_ProdutoToUsuario_B_fkey";

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "label_url" TEXT,
ADD COLUMN     "melhorenvio_purchase_id" TEXT,
ADD COLUMN     "melhorenvio_shipment_id" TEXT,
ADD COLUMN     "shipping_metadata" JSONB,
ADD COLUMN     "shipping_status" TEXT,
ADD COLUMN     "tracking_number" TEXT;

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "imagemPublicId" TEXT,
ALTER COLUMN "estrelas" SET NOT NULL,
ALTER COLUMN "estrelas" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "documento" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ProdutoToUsuario";

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_produtoId_key" ON "Favorito"("usuarioId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_documento_key" ON "Usuario"("documento");

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
