// Script to bulk create players from the 2025 list
import prisma from '../lib/prisma';

const playerNames = [
  'Joel Meireles', 'Pedro Santos', 'Nuno Costa', 'Tiago Afonso', 'Bertino',
  'Márcio Teixeira', 'Guilherme Sousa', 'Filipe Dias', 'Rui Vieira', 'Marcos Garcia',
  'Ricardo Soares', 'Ângelo Ramos', 'Vitor Hugo', 'José Santos', 'Tomás Marques',
  'Daniel Barros', 'Valter Martins', 'António Ribeiro', 'Rui Bertuzi', 'António Costa',
  'Rui Moreira', 'Telmo Carvalho', 'André Branco', 'Nuno Macedo', 'Luís Cadeco',
  'Paulo Ribeiro', 'João Fernandes', 'Nuno Machado', 'Ruben Pinto', 'Pedro Duarte',
  'Miguel Braga', 'Vasco Oliveira', 'Ricardo Gomes', 'Giorgio Ramondetta', 'Rui Sampaio',
  'Ricardo Miranda', 'Leandro Marinho', 'Marco Leite', 'Joel Geraldes', 'Cristiano Cancujo',
  'Miguel Matias', 'Gustavo Martins', 'Tiago Monteiro', 'Cláudio Sá', 'Nuno Ferreira',
  'Nuno Dias', 'Miguel Guimarães', 'Alírio Mota', 'Miguel Carneiro', 'Miguel Caldeira',
  'Jorge Guimarães', 'Hugo Landolt', 'João Pedro Fonseca', 'Bruno Oliveira', 'Tito Coelho',
  'Ricardo Silva', 'Mateus Morais', 'Rui Conceição', 'Pedro Manso', 'Ruben Moreira',
  'João Alves', 'Tiago Macieira', 'Paulo Costa', 'Diogo Oliveira', 'Miguel Simões',
  'Francisco Nogueira', 'João Carvalho', 'André Cardoso', 'Miguel Oliveira', 'Dinis Azevedo',
  'Pedro Pereira', 'Ricardo Martins', 'Ricardo Couto Silva', 'Abílio Monteiro', 'Júlio Mejia',
  'Pedro Bezelga', 'Franklin Salas', 'João Saraiva', 'Francisco Pinto', 'Diogo Pimenta',
  'Luís F Sousa', 'Eduardo Salgado', 'Luís Faria', 'Pedro Leite', 'Daniel Pereira',
  'Paulo Miranda', 'Eduardo Pintado', 'Henrique Fernandes', 'Ricardo Vareiro', 'João Redondo',
  'Martim Amorim', 'António Gonçalves Cardoso', 'Fábio Almeida', 'Tomás Busto', 'Miguel Cruz',
  'Fábio Rocha', 'Francisco Marques', 'João Coelho', 'Mateus Carvalho', 'Nuno G Gonçalves',
  'Paulo Carvalho', 'Michael Fernandes', 'Rafael Afonso', 'Tiago Andrade', 'Ronny Miller',
  'Ivo Ferreira', 'Álvaro Pinto', 'Fernando Mota', 'Fábio Guimarães', 'Domi',
  'Daniel Pais', 'Rui Dias', 'David Mestre', 'Nuno Azevedo', 'Diogo Costa',
  'Gonçalo Martins', 'Maciel Carvalho', 'Ricardo Moreira', 'Leandro Filipe Silva', 'Paulo Damas',
  'Paulo Leitão', 'Tiago Pimentel', 'Filipe Castro', 'Ricardo Sousa', 'Miguel Barbosa',
  'Nuno Pires', 'Jorge Garcia', 'Zé Luís Silva', 'António Nunes', 'Júnior Oliveira',
  'Pedro Monteiro', 'Nuno Dionísio', 'Fernando Ferreira', 'Paulo Matias', 'Emily Jacome',
  'Carlos Dias', 'Alberto Silva', 'Miguel Mendes', 'Pedro Maia', 'Ricardo Crespo',
  'Gonçalo Costa', 'Silvio Monteiro', 'Tiago Ribeiro', 'Dinis Sousa', 'Tiago Almeida',
  'João Ferro', 'Paulino', 'Diogo Freitas', 'João Rafael', 'António Cardoso',
  'Hugo Ferreira', 'Nacho Gallo', 'Rui Moreira Silva', 'Leandro Gonçalves', 'João Correia',
  'José Magro', 'Marco Mesquita', 'Rodrigo Maganinho', 'Ricardo Vieira Macedo', 'Pedro Seabra',
  'Pedro Rosa', 'Bernardo Ferro', 'Ricardo Santos', 'Bruno Osório', 'Pedro Barral',
  'Hugo Carvalho', 'Adriano Lopes', 'Diogo Ribeiro', 'Nuno Martins', 'Hugo Guedes',
  'Mário Negrão', 'Vasco Barbosa', 'João Costa', 'Manuel Vieira', 'João Bernardo',
  'Paulo Sousa', 'João Oliveira', 'Hugo Torres', 'Vitor Silva', 'Bruno Ramalho',
  'Leandro Gomes', 'Jay Jesus', 'Diogo Nunes', 'Jaqueline Andrade', 'Pedro Carvalho',
  'Tiago Manso', 'Paulo Almeida', 'Pedro Mota', 'Ana Manso', 'Daniel Fontes',
  'Luís Braga', 'Diogo Torres', 'Torcato Monteiro', 'Miguel Neto', 'José Sousa',
  'João Ferreira', 'Joaquim Monteiro', 'André Coelho', 'Samuel Marques', 'Rita Costa',
  'Luís Costa Pereira', 'Diogo Pais', 'Alberto Amorim', 'Ricardo Ribeiro', 'Joel Santos',
  'Tiago Ferraz', 'João Elias', 'Luís Gomes', 'Henrique Morais', 'Tomás Menéres',
  'Gustavo Melo', 'Bessa', 'Pedro Cunha', 'Nuno Cordeiro', 'Vasco Silva',
  'Eduardo Jesus', 'Ivan Ortega', 'Pol Jean-Mairet', 'Francisco Campos', 'João Barros',
  'Diogo Neves', 'Rui Franco', 'Pedro Marques', 'Rui Baptista', 'Jorge Melo',
  'João Paupério', 'Gonçalo Lopes', 'Pedro Piçarra', 'Rui Santos', 'Francisco Furtado',
  'Joel Ferreira', 'Tom Ozkavaf', 'Carlos Teixeira', 'André Ferreira', 'Igor Araújo',
  'Pedro Sá Couto', 'José Silva', 'Manuel Maia', 'Hélio Soares', 'João Vasco Pinto',
  'Pedro Santos 2.0', 'Raquel Begonha', 'Luís Valente', 'Pedro Moreira 2', 'André Teixeira',
  'Ricardo Oliveira', 'Martim Ferreira', 'João Correia 2', 'Pedro Gomes', 'Schadia Castillo',
  'Raquel Povoas', 'Vasco Costa', 'Nuno Rodrigues', 'César Carvalho', 'Quim Ferraz',
  'Tiago Silva', 'Eduardo Correia', 'Tomás Bessa', 'Ricardo Ramos', 'Damian',
  'Filipe Duarte', 'Francisco Ramos', 'Silvério Ramos', 'Pedro Mendes', 'Francisco Peixoto',
  'Gonçalo Machado', 'Miguel Aguiar', 'Rúben Silva', 'Francisco Ferreira', 'João Maia',
  'Ruben Pereira', 'Ricardo Arcipreste', 'Hugo Tavares', 'Celestino Leocádio', 'Hugo Lima',
  'João Carido', 'Guilherme Soares', 'Israel Alves', 'Tiago Torre', 'Joel Alegria',
  'João Nakamura', 'João Azevedo', 'Francisco Matos', 'Miguel Pato', 'Vitor Fernandes',
  'Pedro Tavares', 'Rafael Cavalheiro', 'André Rodrigues', 'Nuno Praça', 'André Salazar',
  'Pedro Frias', 'Ivo Tavares', 'Serafim Santos', 'Ricardo Pimentel', 'Pedro Moreira',
  'José Domingues', 'Francisco Lopes', 'Gonçalo Freitas', 'Marco Poço', 'Hugo Cardoso',
  'Gonçalo Ferro', 'Fábio Vilas Boas', 'Ricardo Pereira', 'Nuno Cardoso', 'Tiago Somensi',
  'Rui Madureira', 'Vasco Ramos', 'Guilherme Carvalho', 'João Menezes', 'Sérgio Oliveira',
  'Miguel Ribeiro', 'Carlos Monterroso', 'Gabriel Ribeiro', 'António Rodrigues', 'Martim Flower',
  'Emanuel Santos', 'Vasco Rodas', 'Bruno Teixeira', 'Domingos Ribeiro', 'Nuno Brito',
  'Cristiano Aguiar', 'Paulo Ferreira', 'João Dias', 'Luís Silva', 'Tó Bujardas',
  'André Maia', 'Nuno Silva', 'Ricardo Silva 2', 'Hugo Almeida', 'Pedro Sá',
  'João Sousa', 'Rodrigo Costa', 'Tiago Mendes', 'Filipe Andrade',
];

async function createPlayers() {
  console.log(`Creating ${playerNames.length} players...`);

  let created = 0;
  let skipped = 0;

  for (const name of playerNames) {
    try {
      // Check if player already exists
      const existing = await prisma.player.findFirst({
        where: { name },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create player
      const player = await prisma.player.create({
        data: { name },
      });

      // Create stats
      await prisma.playerStats.create({
        data: { playerId: player.id },
      });

      created++;
      if (created % 50 === 0) {
        console.log(`Created ${created} players so far...`);
      }
    } catch (error) {
      console.error(`Error creating ${name}:`, error);
    }
  }

  console.log(`\n✅ Created: ${created} players`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  console.log(`📊 Total: ${created + skipped}/${playerNames.length}`);

  await prisma.$disconnect();
}

createPlayers();
