<template>
  <header>
    <div>
      <h1>Films</h1>
    </div>
  </header>
  <main>
    <h2>Sort options</h2>
    <div>
      <div class="flex" v-for="sortOptionName in Object.keys(sortOptions)">
        <input @click="clearFilms" type="checkbox" :id="sortOptionName" :value="sortOptionName" v-model="sortOptions[sortOptionName].present">
        <p>{{ sortOptionName }}</p>
      </div>
      <div class="flex options">
        <template v-for="sortOptionName in Object.keys(sortOptions).filter(sortOptionName => sortOptions[sortOptionName].present)">
          <div class="button" @click="changeOrder(sortOptions[sortOptionName])">{{ `${sortOptionName} : ${sortOptions[sortOptionName][sortOptions[sortOptionName].current]}` }}</div>
        </template>
      </div>
    </div>
    <button class="load" @click="loadMoreFilms">Load more | Reload when sort settings changed</button>
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
      <template v-for="film in films">
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
      </template>
    </table>
    <button class="load" @click="loadMoreFilms">Load more | Reload when sort settings changed</button>
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

.flex {
  display: flex;
  gap: 10px;
}

.button {
  cursor: pointer;
}

.load {
  margin: 10px 0;
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
          asc: 'Oldest',
          desc: 'Newest',
          present: false,
          current: 'desc',
        },
        imdbRating: {
          asc: 'Ascending',
          desc: 'Descending',
          present: false,
          current: 'desc',
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
        let url = 'https://localhost:5000/films';
        const entries = Object.entries(this.sortOptions).filter(([, options]) => options.present);
        if (entries.length) url += '?';
        for (const index in entries) {
          const [name, options] = entries[index];
          if (+index !== 0) url += '&';
          url += `${name}=${options.current}`;
        };
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }).then(response => response.json());
        console.log(response);
        this.films.push(response);
      } catch (error) {
        console.error('Error:', error);
      }
    },
    changeOrder(sortOption) {
      if (sortOption.current === 'desc') sortOption.current = 'asc';
      else sortOption.current = 'desc';
      this.clearFilms();
    },
    clearFilms() {
      this.films = [];
    }
  }
}
</script>
