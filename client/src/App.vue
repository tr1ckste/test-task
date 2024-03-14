<template>
  <header>
    <div>
      <h1>Films</h1>
    </div>
  </header>
  <main>
    <h2>Sort options</h2>
    <div>
      <div></div>
    </div>
    <template v-for="film in films">
      <table style="width:100%">
        <tr>
          <th>Title</th>
          <th>Year</th>
          <th>Countries</th>
          <th>Genres</th>
          <th>IMDB rating</th>
          <th>Cast</th>
          <th>Directors</th>
          <th>Plot</th>
        </tr>
        <tr>
          <td>{{ film.title }}</td>
          <td>{{ film.year }}</td>
          <td><p v-for="country in film.countries">{{ country }}</p></td>
          <td><p v-for="genre in film.genres">{{ genre }}</p></td>
          <td>{{ film.imdb.rating }}</td>
          <td><p v-for="actor in film.cast">{{ actor }}</p></td>
          <td><p v-for="director in film.directors">{{ director }}</p></td>
          <td>{{ film.plot }}</td>
        </tr>
      </table>
    </template>
    <button @click="loadFilms">Load more</button>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

table {
  border: 1px solid white;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
<script>
export default {
  name: 'App',
  data: () => {
    return {
      films: [],
      sortOptions: {
        year: {
          ascending: 'Oldest',
          descending: 'Newest',
          present: false,
        },
        imdbRating: {
          ascending: 'Ascending',
          descending: 'Descending',
          present: false,
        },
      },
    }
  },
  async mounted() {
    await this.loadMoreFilms();
  },
  methods: {
    async loadMoreFilms() {
      try {
        const response = await fetch('https://localhost:5000/films?year+desc&=1&pageSize=5', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }).then(response => response.json());

        this.films.push(response);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
}
</script>
