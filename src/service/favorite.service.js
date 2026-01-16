import * as favoriteRepo from '../repositories/favorite.repository.js'
import * as produtcRepo from '../repositories/product.repository.js'

//Favoritar o produto
export const createFavorite = async ({usuarioId, produtoId}) =>{
    const produto = await produtcRepo.findProductById(produtoId);
    
    //garantir a existiência do produto
    if(!produto) {
        const error = new Error('Produto não encontrado');
        error.status = 404;
        throw error;
    }

    // Impedimento de duplicidade 
  // Não permitir que o mesmo usuário favorite o mesmo produto mais de uma vez
  const alreadyExistsFavorite = await favoriteRepo.findSpecific(usuarioId, produtoId);
  if (alreadyExistsFavorite) {
    const error = new Error('Produto já favoritado');
    error.status = 409; // Padronização exigida para conflito 
    throw error;
  }

  //Persistência correta no banco 
  return await favoriteRepo.create(usuarioId, produtoId);
};


//Desfavoritar
export const deleteFavorite = async (usuarioId, produtoId) => {
  //O produto deve estar favoritado previamente pelo usuário [1]
  const favorito = await favoriteRepo.findSpecific(usuarioId, produtoId);
  
  if (!favorito) {
    const error = new Error('Favorito não encontrado');
    error.status = 404; // Padronização de erro para recurso não encontrado [3]
    throw error;
  }

  //Remover o registro do banco através do repositório [1]
  return await favoriteRepo.remove(favorito.id);
};

/*Lista os produtos favoritos do usuário autenticado*/
export const listFavorite = async (usuarioId) => {
  //Busca todos os registros vinculados ao usuário 
  //O repositório deve usar 'include' para trazer os dados do produto
  const favoritos = await favoriteRepo.findByUsuario(usuarioId);

  //Payload enxuto: transforma os dados para não expor informações sensíveis 
  return favoritos.map(f => ({
    id: f.produto.id,
    nome: f.produto.nome,
    preco: f.produto.preco,
    slug: f.produto.slug,
    imagemUrl: f.produto.imagemUrl,
    // Note que não retornamos dados internos como o ID da tabela de junção
  }));
};