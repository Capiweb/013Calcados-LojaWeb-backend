-- Migration: add_produto_categorias
-- Converts Produto.categoriaId (1:N) to implicit many-to-many via _CategoriaToProduto

-- Remove foreign key constraint on categoriaId (if exists)
ALTER TABLE "Produto" DROP CONSTRAINT IF EXISTS "Produto_categoriaId_fkey";

-- Remove categoriaId column from Produto (if exists)
ALTER TABLE "Produto" DROP COLUMN IF EXISTS "categoriaId";

-- Create the implicit many-to-many join table
CREATE TABLE IF NOT EXISTS "_CategoriaToProduto" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Add unique index and B index (required by Prisma)
CREATE UNIQUE INDEX IF NOT EXISTS "_CategoriaToProduto_AB_unique" ON "_CategoriaToProduto"("A", "B");
CREATE INDEX IF NOT EXISTS "_CategoriaToProduto_B_index" ON "_CategoriaToProduto"("B");

-- Add foreign keys
ALTER TABLE "_CategoriaToProduto"
    ADD CONSTRAINT "_CategoriaToProduto_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CategoriaToProduto"
    ADD CONSTRAINT "_CategoriaToProduto_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
