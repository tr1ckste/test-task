<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <header>
    <div>
      <h1>Films</h1>
    </div>
  </header>
  <main>
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
    }
  },
  async mounted() {
    try {
      const response = await fetch('https://localhost:5000/films?page=1&pageSize=5', {
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
</script>
