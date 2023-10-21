<h1 align="center"> 
	Government Data Analysis
</h1>

<p align="center">	
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/yuripalacio/government-data-analysis">

  <a href="https://www.linkedin.com/in/yuripalacio/">
    <img alt="Made by yuripalacio" src="https://img.shields.io/badge/made%20by-Yuri%20Palacio-%2304D361">
  </a>
  
  <a href="https://github.com/yuripalacio/mychat/commits/master">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/yuripalacio/government-data-analysis">
  </a>
</p>

<p align="center">
  <a href="#installation">Instalation</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#execution">Execution</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#questions">Questions</a>
</p>


## Installation
1. Make sure you have Node.js version 20.5.0 or higher installed. If you don't, install the nvm package manager and then install Node.js version 20.5.0.

2. Perform the project clone.
    ```bash
    git clone https://github.com/yuripalacio/government-data-analysis.git
    ```

3. Instead of `npm`, this project uses `pnpm` as the package manager. If you do not have `pnpm`, install it using the following command:
    ```bash
    npm install --global pnpm
    ```

4. Access the folder and install the project dependencies.
    ```bash
    pnpm install
    ```

5. Add the .env file to the project root as per the .env.example file if you wish to change any parameters. If you don't wish to perform this process, the project will run with default values.

## Execution
This program expects the base files to be located in the `input` folder and will generate the results in the `output` folder.

Please add the base files to the `input` folder before starting the project. If you proceed without the files, the program will respond with an exception, such as:
```bash
File does not exists <file_name>
```

##### Locally execution
To process the files and generate the CSVs, execute the following command in the project folder:
```bash
pnpm run start:dev
```

##### For production environment
You could execute this project as a production version. To do that, you need to execute the following commands:

```bash
# generate the build project
pnpm run build
```

```bash
# execute the build project
pnpm run start
```

## Questions
### 1. Discuss your solution’s time complexity. What tradeoffs did you make?
This solution performs quite well. I used NodeJS streams to process large quantities of data.
With this approach, I didn't need to load all the CSV files into memory and could work with chunks of data.

### 2. How would you change your solution to account for future columns that might be requested, such as “Bill Voted On Date” or “Co-Sponsors”?
It depends on how that information will be used. If there is no immediate need for them, the program will continue to function without any changes.
However, the first think to change is the `entities` and adding this new columns for to be usable before.

Regarding "Bill Voted On Date", it would require an additional step in the process, which would be performed before the current process in the `BillsReportUseCase`. We would need to introduce a new loop that considers the date to find all the bills voted on that specific day, and then proceed with the same processing steps as before.

For "Co-Sponsors" it could be more simple, if we still have one line for bill with only a new column contains the Co-Sponsors ID. We need to add the same process how we already had to got the primary sponsor name passing the co-sponsors id.

### 3. How would you change your solution if instead of receiving CSVs of data, you were given a list of legislators or bills that you should generate a CSV for?
Depending on how the list is provided, I would simply need to modify the line where I currently use `createReadStream` and instead receive an HTTP request, for example.

The most important thing is that the new approach should return a stream. Without that, we might encounter memory issues.

### 4. How long did you spend working on the assignment?
I spent around 3 hours working on this solution. The most challenging part was working without a database.

With a database, it would be much simpler to establish relationships between the records, and the entire process would be faster.

This would likely result in a query similar to the following:

`legislators-support-oppose-count`
```sql
select
	l.id,
	l."name",
	SUM(case when vr.vote_type = '1' then 1 else 0 end) as num_supported_bills,
	SUM(case when vr.vote_type = '2' then 1 else 0 end) as num_opposed_bills
from
	legislators l
inner join
	vote_results vr
on
	vr.legislator_id = l.id
group by
	l.id,
	l."name"
```

`bills`
```sql
select
	b.id,
	b.title,
	sum(case when vr.vote_type = '1' then 1 else 0 end) as supporter_count,
	sum(case when vr.vote_type = '2' then 1 else 0 end) as opposer_count,
	case when l."name" is null then 'Unknown' else l."name" end as primary_sponsor
from
	bills b
inner join
	votes v
on
	v.bill_id = b.id
inner join
	vote_results vr
on
	vr.vote_id = v.id
left join
	legislators l
on
	l.id = b.primary_sponsor
group by
	b.id,
	b.title,
	l."name" 
```
To implement a database, I would create four upload processes that would read the files and insert data into the database.

I would consider using Prisma ORM or TypeORM and create repositories with dependency injection, in case there's a need to switch to another ORM or a similar tool in the future.

Before implementing the database, in the WebAPI, I would establish the connection to the database and ensure that each route returns the query results with pagination.

By [Yuri Palacio](https://www.linkedin.com/in/yuri-palacio/) :wave:
