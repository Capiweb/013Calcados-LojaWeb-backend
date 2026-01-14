-- DropForeignKey
ALTER TABLE "public"."Carrinho" DROP CONSTRAINT "Carrinho_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CarrinhoItem" DROP CONSTRAINT "CarrinhoItem_produtoVariacaoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PedidoItem" DROP CONSTRAINT "PedidoItem_produtoVariacaoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProdutoVariacao" DROP CONSTRAINT "ProdutoVariacao_produtoId_fkey";

-- AlterTable
ALTER TABLE "public"."Produto" ADD COLUMN     "estrelas" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."ProdutoVariacao" ADD COLUMN     "cores" TEXT[];

-- CreateTable
CREATE TABLE "public"."_ProdutoToUsuario" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProdutoToUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProdutoToUsuario_B_index" ON "public"."_ProdutoToUsuario"("B");

-- AddForeignKey
ALTER TABLE "public"."ProdutoVariacao" ADD CONSTRAINT "ProdutoVariacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Carrinho" ADD CONSTRAINT "Carrinho_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_produtoVariacaoId_fkey" FOREIGN KEY ("produtoVariacaoId") REFERENCES "public"."ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PedidoItem" ADD CONSTRAINT "PedidoItem_produtoVariacaoId_fkey" FOREIGN KEY ("produtoVariacaoId") REFERENCES "public"."ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProdutoToUsuario" ADD CONSTRAINT "_ProdutoToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProdutoToUsuario" ADD CONSTRAINT "_ProdutoToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
